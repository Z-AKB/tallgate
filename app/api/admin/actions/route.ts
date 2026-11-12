import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/auth/guards"
import { readJsonObject, isValidEmailAddress, isNonEmptyText, isOptionalText } from "@/lib/api/request"
import {
  CANONICAL_MODULE_TITLE,
  DEFAULT_COURSE_LEVEL,
  planCatalogueSeed,
  slugify,
  toCourseInsert,
  type ExistingCatalogueCourse,
} from "@/lib/admin/catalogueSeed"
import {
  issueCourseCertificate,
  type IssueCertificateFailure,
  claimAndSendCertificateEmail,
  releaseStaleEmailLeases,
  checkCertificateEmailRetryAllowed,
} from "@/lib/certificates/issueCertificate"
import { certificateEmailIdempotencyKey } from "@/lib/certificates/sendCertificateEmail"
import { checkCourseCompletion } from "@/lib/assessments/completion"
import { toCourse } from "@/lib/data/adminRowMappers"
import { coursesData } from "@/lib/data/courses"
import { paymentStatusError } from "@/lib/admin/paymentStatusErrors"
import {
  auditOutcomeFromStatus,
  extractAuditTarget,
  recordAdminAudit,
} from "@/lib/admin/auditLog"
import type { Database } from "@/types/supabase"
import { isNonEmptyString, isOneOf, isRecord } from "@/lib/utils"
import { logError } from "@/lib/logging/logger"

export const runtime = "nodejs"

/**
 * Logs the underlying database/upstream error server-side and returns a
 * stable, non-leaking message for the client. Raw Postgres/PostgREST messages
 * can disclose schema, constraint, and column names.
 */
function genericDbError(context: string, error: unknown): string {
  logError("admin_action.db_error", error, { operation: context })
  return "The operation could not be completed. Please try again."
}

type AdminAuditContext = {
  actorId: string | null
  action: string | null
  target: string | null
}

type ConsultationUpdate = Database["public"]["Tables"]["consultation_requests"]["Update"]
type StartupApplicationUpdate = Database["public"]["Tables"]["startup_applications"]["Update"]
type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"]
type CertificateUpdate = Database["public"]["Tables"]["certificates"]["Update"]
type ContactMessageUpdate = Database["public"]["Tables"]["contact_messages"]["Update"]
type PaymentInsert = Database["public"]["Tables"]["payment_requests"]["Insert"]
type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"]
type CourseRow = Database["public"]["Tables"]["courses"]["Row"]

type ConsultationStatus = Database["public"]["Tables"]["consultation_requests"]["Row"]["status"]
type StartupApplicationStatus = Database["public"]["Tables"]["startup_applications"]["Row"]["status"]
type MessageStatus = Database["public"]["Tables"]["contact_messages"]["Row"]["status"]
type PaymentStatus = Database["public"]["Tables"]["payment_requests"]["Row"]["status"]
type PaymentMethod = Database["public"]["Tables"]["payment_requests"]["Row"]["method"]

const CONSULTATION_STATUSES: readonly ConsultationStatus[] = [
  "pending",
  "contacted",
  "in_progress",
  "closed",
]

const STARTUP_APPLICATION_STATUSES: readonly StartupApplicationStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "declined",
]

const MESSAGE_STATUSES: readonly MessageStatus[] = ["unread", "read", "responded", "archived"]

const PAYMENT_STATUSES: readonly PaymentStatus[] = ["pending", "confirmed", "declined", "refunded"]
const PAYMENT_METHODS: readonly PaymentMethod[] = ["bank_transfer", "card", "cash", "other"]

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type RoleAssignmentResult = { error: null; status?: undefined } | { error: string; status: 400 | 503 }

/**
 * Assigns a user's single role with one atomic upsert. The
 * `20261007100000_enforce_single_role_per_user.sql` migration replaces the
 * old `unique(user_id, role_id)` constraint with `unique(user_id)`, which
 * makes `on conflict (user_id)` the correct, race-free write target.
 */
async function assignUserRole(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string,
  roleId: string
): Promise<RoleAssignmentResult> {
  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    return { error: genericDbError("Role assignment profile lookup failed:", profileError), status: 503 }
  }
  if (!profile) {
    return { error: "This user's profile no longer exists, so the role cannot be assigned.", status: 400 }
  }

  const { error: upsertError } = await adminSupabase
    .from("user_roles")
    .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id" })

  if (upsertError) {
    return { error: genericDbError("Role assignment upsert failed:", upsertError), status: 503 }
  }

  return { error: null }
}

type CatalogueSeedSummary = {
  createdCourses: number
  createdModules: number
  createdLessons: number
  skippedCourses: number
  conflicts: string[]
}

function buildSeedMessage(summary: CatalogueSeedSummary): string {
  const parts: string[] = []
  if (summary.createdCourses > 0) {
    parts.push(`${summary.createdCourses} course${summary.createdCourses === 1 ? "" : "s"} created`)
  }
  if (summary.createdModules > 0) {
    parts.push(`${summary.createdModules} module${summary.createdModules === 1 ? "" : "s"} created`)
  }
  if (summary.createdLessons > 0) {
    parts.push(`${summary.createdLessons} lesson${summary.createdLessons === 1 ? "" : "s"} created`)
  }
  if (parts.length === 0) {
    parts.push("Learning Hub catalogue is already in sync")
  }
  if (summary.conflicts.length > 0) {
    parts.push(
      `${summary.conflicts.length} existing course${summary.conflicts.length === 1 ? " has" : "s have"} a different title and were left unchanged`
    )
  }
  return `${parts.join("; ")}.`
}

export async function POST(req: NextRequest) {
  const audit: AdminAuditContext = { actorId: null, action: null, target: null }

  const response = await handleAdminAction(req, audit)

  // Security-relevant admin actions are recorded with actor, action, target and
  // outcome. Requests that never authenticated (no actor) are not attributed
  // here and are handled by the proxy/rate limiter instead.
  if (audit.actorId && audit.action) {
    await recordAdminAudit({
      actorId: audit.actorId,
      action: audit.action,
      target: audit.target,
      outcome: auditOutcomeFromStatus(response.status),
    })
  }

  return response
}

async function handleAdminAction(
  req: NextRequest,
  audit: AdminAuditContext
): Promise<NextResponse> {
  try {
    const admin = await requireAdminApi()
    if (admin.error) return admin.error
    audit.actorId = admin.user.id

    const parsed = await readJsonObject(req)
    if (parsed.response) return parsed.response

    const { action, payload } = parsed.data
    if (typeof action !== "string" || !action.trim()) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }
    if (!isRecord(payload)) {
      return NextResponse.json({ error: "A valid action payload is required." }, { status: 400 })
    }

    audit.action = action.trim()
    audit.target = extractAuditTarget(payload)

    const supabase = await createClient()

    switch (action) {
      case "update_consultation_status": {
        const { id, status, admin_notes } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A consultation request id is required." }, { status: 400 })
        }
        if (!isOneOf(CONSULTATION_STATUSES, status)) {
          return NextResponse.json({ error: "Invalid consultation status." }, { status: 400 })
        }
        if (admin_notes !== undefined && admin_notes !== null && !isOptionalText(admin_notes, 2000)) {
          return NextResponse.json({ error: "Admin notes must be 2000 characters or fewer." }, { status: 400 })
        }

        const updateData: ConsultationUpdate = { status, updated_at: new Date().toISOString() }
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes

        const { data: updated, error } = await supabase
          .from("consultation_requests")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Consultation status update failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Consultation status was not changed: the request was not found." },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, message: "Consultation status updated" })
      }

      case "update_startup_status": {
        const { id, status } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A startup application id is required." }, { status: 400 })
        }
        if (!isOneOf(STARTUP_APPLICATION_STATUSES, status)) {
          return NextResponse.json({ error: "Invalid startup application status." }, { status: 400 })
        }

        const updateData: StartupApplicationUpdate = { status, updated_at: new Date().toISOString() }

        const { data: updated, error } = await supabase
          .from("startup_applications")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Startup application status update failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Startup application status was not changed: the application was not found." },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, message: "Startup application status updated" })
      }

      case "toggle_course_publish": {
        const { id, is_published } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A course id is required." }, { status: 400 })
        }
        if (typeof is_published !== "boolean") {
          return NextResponse.json({ error: "is_published must be a boolean." }, { status: 400 })
        }

        const updateData: CourseUpdate = { is_published }

        const { data: updated, error } = await supabase
          .from("courses")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Course publish toggle failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Course status was not changed: the update matched no rows. Check that the admin course update migration has been applied." },
            { status: 409 }
          )
        }
        return NextResponse.json({ success: true, message: "Course status updated" })
      }

      case "toggle_course_popular": {
        const { id, is_popular } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A course id is required." }, { status: 400 })
        }
        if (typeof is_popular !== "boolean") {
          return NextResponse.json({ error: "is_popular must be a boolean." }, { status: 400 })
        }

        const updateData: CourseUpdate = { is_popular }

        const { data: updated, error } = await supabase
          .from("courses")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Course popularity toggle failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Course popularity was not changed: the update matched no rows. Check that the admin course update migration has been applied." },
            { status: 409 }
          )
        }
        return NextResponse.json({ success: true, message: "Course popularity updated" })
      }

      case "update_course_domain": {
        const { id, category } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A course id is required." }, { status: 400 })
        }
        if (!isNonEmptyString(category) || category.trim().length > 80) {
          return NextResponse.json(
            { error: "A domain name of 80 characters or fewer is required." },
            { status: 400 }
          )
        }

        const updateData: CourseUpdate = { category: category.trim() }

        const { data: updated, error } = await supabase
          .from("courses")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Course domain update failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Course domain was not changed: the update matched no rows. Check that the admin course update migration has been applied." },
            { status: 409 }
          )
        }

        // Keep the admin-managed domain list in sync so a newly typed domain is
        // persisted for reuse. Existing domains are left untouched, and a sync
        // failure never fails the course move that already succeeded.
        const { error: categoryError } = await supabase
          .from("course_categories")
          .upsert(
            { name: category.trim(), display_order: 0 },
            { onConflict: "name", ignoreDuplicates: true }
          )
        if (categoryError) {
          logError("admin_action.course_category_sync_failed", categoryError)
        }

        return NextResponse.json({ success: true, message: "Course domain updated" })
      }

      case "create_course": {
        const {
          title,
          category,
          level,
          price_ngn,
          duration,
          short_description,
          overview,
          prerequisites,
          learning_outcomes,
          is_published,
        } = payload

        if (!isNonEmptyText(title, 200)) {
          return NextResponse.json(
            { error: "A course title of 200 characters or fewer is required." },
            { status: 400 }
          )
        }
        if (!isNonEmptyText(category, 80)) {
          return NextResponse.json(
            { error: "A domain of 80 characters or fewer is required." },
            { status: 400 }
          )
        }
        if (!isOptionalText(level, 40)) {
          return NextResponse.json(
            { error: "Level must be 40 characters or fewer when provided." },
            { status: 400 }
          )
        }
        if (!isNonEmptyText(duration, 80)) {
          return NextResponse.json(
            { error: "A duration of 80 characters or fewer is required." },
            { status: 400 }
          )
        }
        if (!isNonEmptyText(short_description, 300)) {
          return NextResponse.json(
            { error: "A short description of 300 characters or fewer is required." },
            { status: 400 }
          )
        }
        if (!isNonEmptyText(overview, 2000)) {
          return NextResponse.json(
            { error: "An overview of 2000 characters or fewer is required." },
            { status: 400 }
          )
        }
        if (!isOptionalText(prerequisites, 500)) {
          return NextResponse.json(
            { error: "Prerequisites must be 500 characters or fewer." },
            { status: 400 }
          )
        }

        const parsedPrice = typeof price_ngn === "string" ? Number(price_ngn) : price_ngn
        let price = 0
        if (price_ngn !== undefined && price_ngn !== null && price_ngn !== "") {
          if (
            typeof parsedPrice !== "number" ||
            !Number.isFinite(parsedPrice) ||
            parsedPrice < 0 ||
            parsedPrice > 99_999_999.99
          ) {
            return NextResponse.json(
              { error: "Price must be a number between 0 and 99,999,999.99." },
              { status: 400 }
            )
          }
          price = Math.round(parsedPrice * 100) / 100
        }

        let outcomes: string[] = []
        if (learning_outcomes !== undefined && learning_outcomes !== null) {
          if (!Array.isArray(learning_outcomes) || learning_outcomes.length > 30) {
            return NextResponse.json(
              { error: "Learning outcomes must be a list of up to 30 items." },
              { status: 400 }
            )
          }
          for (const outcome of learning_outcomes) {
            if (!isNonEmptyText(outcome, 120)) {
              return NextResponse.json(
                { error: "Each learning outcome must be 1-120 characters." },
                { status: 400 }
              )
            }
          }
          outcomes = learning_outcomes.map((outcome) => outcome.trim())
        }

        const baseSlug = slugify(title)
        if (!baseSlug) {
          return NextResponse.json(
            { error: "The course title must contain at least one letter or number." },
            { status: 400 }
          )
        }

        const insertBase: CourseInsert = {
          slug: baseSlug,
          title: title.trim(),
          category: category.trim(),
          level: isNonEmptyString(level) ? level.trim() : DEFAULT_COURSE_LEVEL,
          price_ngn: price,
          duration: duration.trim(),
          short_description: short_description.trim(),
          overview: overview.trim(),
          learning_outcomes: outcomes,
          prerequisites: isNonEmptyString(prerequisites) ? prerequisites.trim() : null,
          is_popular: false,
          is_published: typeof is_published === "boolean" ? is_published : true,
          display_order: 0,
        }

        let createdCourse: CourseRow | null = null
        let createError: unknown = null
        for (let attempt = 0; attempt < 6; attempt++) {
          const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
          const { data, error } = await supabase
            .from("courses")
            .insert({ ...insertBase, slug })
            .select("*")
            .single()
          if (!error) {
            createdCourse = data
            createError = null
            break
          }
          createError = error
          if (error.code !== "23505") break
        }

        if (createError || !createdCourse) {
          return NextResponse.json(
            { error: genericDbError("Course creation failed:", createError) },
            { status: 400 }
          )
        }

        const { error: moduleError } = await supabase
          .from("course_modules")
          .insert({ course_id: createdCourse.id, title: CANONICAL_MODULE_TITLE, order_index: 0 })

        if (moduleError) {
          logError("admin_action.course_module_creation_failed", moduleError)
          const { error: draftError } = await supabase
            .from("courses")
            .update({ is_published: false })
            .eq("id", createdCourse.id)
          if (draftError) {
            logError("admin_action.course_draft_revert_failed", draftError)
          }
          return NextResponse.json(
            {
              error:
                "The course was created but its default curriculum module could not be added. It was saved as a draft so it will not appear publicly; retry to complete it.",
            },
            { status: 503 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `${createdCourse.title} was added to the catalogue.`,
          course: toCourse(createdCourse),
        })
      }

      case "seed_learning_hub_courses": {
        const canonicalSlugs = coursesData.map((course) => course.slug)
        const { data: courseRows, error: courseLookupError } = await supabase
          .from("courses")
          .select("*")
          .in("slug", canonicalSlugs)
        if (courseLookupError) {
          return NextResponse.json(
            { error: genericDbError("Learning Hub course lookup failed:", courseLookupError) },
            { status: 503 }
          )
        }

        const existingCourses = courseRows ?? []
        const courseIds = existingCourses.map((course) => course.id)

        let moduleRows: { id: string; course_id: string; title: string }[] = []
        if (courseIds.length > 0) {
          const { data, error } = await supabase
            .from("course_modules")
            .select("id, course_id, title")
            .in("course_id", courseIds)
          if (error) {
            return NextResponse.json(
              { error: genericDbError("Learning Hub module lookup failed:", error) },
              { status: 503 }
            )
          }
          moduleRows = data ?? []
        }

        const moduleIds = moduleRows.map((module) => module.id)
        let lessonRows: { module_id: string; title: string; order_index: number }[] = []
        if (moduleIds.length > 0) {
          const { data, error } = await supabase
            .from("lessons")
            .select("module_id, title, order_index")
            .in("module_id", moduleIds)
          if (error) {
            return NextResponse.json(
              { error: genericDbError("Learning Hub lesson lookup failed:", error) },
              { status: 503 }
            )
          }
          lessonRows = data ?? []
        }

        const existingPlanInput: ExistingCatalogueCourse[] = existingCourses.map((course) => ({
          slug: course.slug,
          title: course.title,
          modules: moduleRows
            .filter((module) => module.course_id === course.id)
            .map((module) => ({
              title: module.title,
              lessonTitles: lessonRows
                .filter((lesson) => lesson.module_id === module.id)
                .map((lesson) => lesson.title),
            })),
        }))

        const plan = planCatalogueSeed(existingPlanInput)
        const summary: CatalogueSeedSummary = {
          createdCourses: 0,
          createdModules: 0,
          createdLessons: 0,
          skippedCourses: 0,
          conflicts: [],
        }
        const createdCourseRows: CourseRow[] = []

        for (let index = 0; index < plan.length; index++) {
          const item = plan[index]
          if (item.titleConflict) {
            summary.conflicts.push(item.course.title)
          }

          let courseId: string
          if (item.createCourse) {
            const { data, error } = await supabase
              .from("courses")
              .insert(toCourseInsert(item.course, index))
              .select("*")
              .single()
            if (error) {
              return NextResponse.json(
                { error: genericDbError("Learning Hub course seed failed:", error) },
                { status: 503 }
              )
            }
            courseId = data.id
            createdCourseRows.push(data)
            summary.createdCourses += 1
          } else {
            summary.skippedCourses += 1
            const existing = existingCourses.find((course) => course.slug === item.course.slug)
            if (!existing) continue
            courseId = existing.id
          }

          for (const modulePlan of item.modules) {
            let moduleId: string
            if (modulePlan.create) {
              const { data, error } = await supabase
                .from("course_modules")
                .insert({
                  course_id: courseId,
                  title: modulePlan.title,
                  order_index: modulePlan.orderIndex,
                })
                .select("id")
                .single()
              if (error) {
                return NextResponse.json(
                  { error: genericDbError("Learning Hub module seed failed:", error) },
                  { status: 503 }
                )
              }
              moduleId = data.id
              summary.createdModules += 1
            } else {
              const existingModule = moduleRows.find(
                (module) => module.course_id === courseId && module.title === modulePlan.title
              )
              if (!existingModule) continue
              moduleId = existingModule.id
            }

            if (modulePlan.lessonTitlesToCreate.length === 0) continue

            // New lessons must be ordered after any lessons already in the
            // module, otherwise a re-seed collides at order_index 0 and the
            // curriculum renders in an ambiguous order.
            const firstOrderIndex =
              lessonRows
                .filter((lesson) => lesson.module_id === moduleId)
                .reduce((max, lesson) => Math.max(max, lesson.order_index), -1) + 1

            const lessonInserts = modulePlan.lessonTitlesToCreate.map(
              (lessonTitle, lessonIndex) => ({
                module_id: moduleId,
                title: lessonTitle,
                content_type: "text" as const,
                order_index: firstOrderIndex + lessonIndex,
                is_preview: false,
              })
            )

            const { error } = await supabase.from("lessons").insert(lessonInserts)
            if (error) {
              return NextResponse.json(
                { error: genericDbError("Learning Hub lesson seed failed:", error) },
                { status: 503 }
              )
            }
            summary.createdLessons += lessonInserts.length
          }
        }

        return NextResponse.json({
          success: true,
          message: buildSeedMessage(summary),
          summary,
          courses: [...existingCourses, ...createdCourseRows].map(toCourse),
        })
      }

      case "issue_certificate": {
        const {
          certificate_type,
          course_id,
          user_id,
          verification_code,
          grade,
          issue_date,
          reason,
          course_title: raw_course_title,
        } = payload

        if (verification_code !== undefined) {
          return NextResponse.json(
            { error: "Verification codes are generated by the server." },
            { status: 400 }
          )
        }

        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!isNonEmptyString(user_id) || !uuidPattern.test(user_id)) {
          return NextResponse.json({ error: "Select a valid learner account." }, { status: 400 })
        }

        if (
          certificate_type !== undefined &&
          certificate_type !== "course_linked" &&
          certificate_type !== "independent"
        ) {
          return NextResponse.json(
            { error: "Certificate type must be course_linked or independent." },
            { status: 400 }
          )
        }

        let certificateAdminClient: ReturnType<typeof createAdminClient>
        try {
          certificateAdminClient = createAdminClient()
        } catch (error: unknown) {
          logError("admin_action.certificate_learner_lookup_failed", error)
          return NextResponse.json(
            { error: "Certificate issuance is temporarily unavailable." },
            { status: 503 }
          )
        }

        const { data: learnerRole, error: learnerRoleError } = await certificateAdminClient
          .from("roles")
          .select("id")
          .eq("name", "learner")
          .maybeSingle()
        if (learnerRoleError || !learnerRole) {
          logError("admin_action.certificate_learner_role_failed", learnerRoleError)
          return NextResponse.json({ error: "Learner accounts could not be verified." }, { status: 503 })
        }

        const [{ data: learnerProfile, error: profileError }, { data: roleAssignment, error: assignmentError }] =
          await Promise.all([
            certificateAdminClient
              .from("profiles")
              .select("full_name, email")
              .eq("id", user_id)
              .maybeSingle(),
            certificateAdminClient
              .from("user_roles")
              .select("user_id")
              .eq("user_id", user_id)
              .eq("role_id", learnerRole.id)
              .maybeSingle(),
          ])

        if (profileError || assignmentError) {
          logError("admin_action.certificate_learner_verification_failed", profileError, {
            assignmentError,
          })
          return NextResponse.json({ error: "Learner account could not be verified." }, { status: 503 })
        }
        if (!learnerProfile || !roleAssignment) {
          return NextResponse.json(
            { error: "Certificates can only be issued to existing learner accounts." },
            { status: 400 }
          )
        }

        let issueDate = new Date().toISOString().slice(0, 10)
        if (issue_date !== undefined) {
          if (typeof issue_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) {
            return NextResponse.json({ error: "Issue date must use YYYY-MM-DD format." }, { status: 400 })
          }
          const parsedIssueDate = new Date(`${issue_date}T00:00:00.000Z`)
          if (
            Number.isNaN(parsedIssueDate.getTime()) ||
            parsedIssueDate.toISOString().slice(0, 10) !== issue_date
          ) {
            return NextResponse.json({ error: "Issue date is not a valid calendar date." }, { status: 400 })
          }
          issueDate = issue_date
        }

        let courseId: string | null = null
        if (course_id !== undefined && course_id !== null && course_id !== "") {
          if (typeof course_id !== "string" || !uuidPattern.test(course_id)) {
            return NextResponse.json({ error: "course_id must be a valid UUID." }, { status: 400 })
          }
          courseId = course_id
        }

        let courseTitle = typeof raw_course_title === "string" ? raw_course_title.trim() : ""
        let certificateTypeFinal: "course_linked" | "independent"
        let manualReason: string | null = null

        const requestedType: "course_linked" | "independent" =
          certificate_type === "course_linked" || certificate_type === "independent"
            ? certificate_type
            : courseId
              ? "course_linked"
              : "independent"

        if (requestedType === "independent") {
          if (courseId) {
            return NextResponse.json(
              { error: "Independent manual certificates must not be linked to a course." },
              { status: 400 }
            )
          }
          if (typeof reason !== "string" || !reason.trim()) {
            return NextResponse.json(
              { error: "A reason is required for independent manual certificates." },
              { status: 400 }
            )
          }
          const trimmedReason = reason.trim()
          if (trimmedReason.length > 500) {
            return NextResponse.json(
              { error: "The issuance reason must be 500 characters or fewer." },
              { status: 400 }
            )
          }
          manualReason = trimmedReason
          if (!courseTitle || courseTitle.length > 200) {
            return NextResponse.json(
              { error: "Provide a certificate title (200 characters or fewer)." },
              { status: 400 }
            )
          }
          certificateTypeFinal = "independent"
        } else {
          if (!courseId) {
            return NextResponse.json(
              { error: "Select a course for course-linked certificates, or choose independent manual issuance with a reason." },
              { status: 400 }
            )
          }

          const { data: course, error: courseError } = await certificateAdminClient
            .from("courses")
            .select("id, title")
            .eq("id", courseId)
            .maybeSingle()
          if (courseError) {
            logError("admin_action.certificate_course_lookup_failed", courseError, { courseId })
            return NextResponse.json(
              { error: "Course details could not be verified for certificate issuance." },
              { status: 503 }
            )
          }
          if (!course) {
            return NextResponse.json(
              { error: "Selected course could not be found." },
              { status: 400 }
            )
          }

          // Never trust a client-supplied title for a course-linked award.
          // Enrollment and completion are re-verified server-side inside
          // issueCourseCertificate(), so omitting or spoofing course_id cannot
          // bypass the completion requirement.
          courseTitle = course.title
          manualReason = null
          certificateTypeFinal = "course_linked"
        }

        const gradeValue = typeof grade === "string" && grade.trim() ? grade.trim().slice(0, 100) : undefined

        const issueResult = await issueCourseCertificate({
          userId: user_id,
          courseId: certificateTypeFinal === "course_linked" ? courseId : null,
          courseTitle,
          grade: gradeValue,
          issueDate,
          recipientEmail: learnerProfile.email ?? undefined,
          recipientName: learnerProfile.full_name ?? undefined,
          issuanceReason: manualReason,
          mandatoryIndependentAuditActorId:
            certificateTypeFinal === "independent" ? audit.actorId : undefined,
        })

        if (issueResult.status === "error") {
          const statusByCode: Record<IssueCertificateFailure["code"], number> = {
            site_url: 503,
            not_found: 503,
            unconfigured: 503,
            not_eligible: 409,
            not_complete: 409,
            reason_required: 400,
            insert: 503,
            pdf: 503,
            storage: 503,
            persist: 503,
          }
          await recordAdminAudit({
            actorId: audit.actorId!,
            action: "issue_certificate",
            target: user_id,
            outcome: "failure",
            details: {
              certificate_type: certificateTypeFinal,
              recipient_user_id: user_id,
              course_id: certificateTypeFinal === "course_linked" ? courseId : null,
              issue_date: issueDate,
              reason: manualReason,
              failure_code: issueResult.code,
            },
          })
          // The structured failure audit above replaces the generic POST-level record.
          audit.actorId = null
          audit.action = null
          return NextResponse.json({ error: issueResult.message }, { status: statusByCode[issueResult.code] })
        }

        if (certificateTypeFinal === "course_linked") {
          await recordAdminAudit({
            actorId: audit.actorId!,
            action: "issue_certificate",
            target: issueResult.certificate.id,
            outcome: "success",
            details: {
              certificate_type: certificateTypeFinal,
              issuing_admin_id: audit.actorId,
              recipient_user_id: user_id,
              course_id: courseId,
              issue_date: issueDate,
              reason: null,
              issuance_status: issueResult.status,
            },
          })
        }

        // Avoid duplicate generic audit record for this action; we already recorded structured details.
        audit.actorId = null
        audit.action = null

        return NextResponse.json({
          success: true,
          certificate: issueResult.certificate,
          verification_url: issueResult.verificationUrl,
          qr_code: issueResult.qrCode,
          download_url: issueResult.downloadUrl,
        })
      }

      case "toggle_certificate_validity": {
        const { id, is_valid } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A certificate id is required." }, { status: 400 })
        }
        if (typeof is_valid !== "boolean") {
          return NextResponse.json({ error: "is_valid must be a boolean." }, { status: 400 })
        }

        const updateData: CertificateUpdate = { is_valid }

        // Mutations on certificates are service-role only since the
        // 20261110160000 hardening revoked UPDATE from authenticated, so this
        // must run through the admin client (the caller is already verified as
        // an admin by requireAdminApi above).
        let certificateAdminClient: ReturnType<typeof createAdminClient>
        try {
          certificateAdminClient = createAdminClient()
        } catch (error: unknown) {
          logError("admin_action.admin_client_unavailable", error)
          return NextResponse.json(
            { error: "Certificate management is temporarily unavailable." },
            { status: 503 }
          )
        }

        const { data: updated, error } = await certificateAdminClient
          .from("certificates")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Certificate validity toggle failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Certificate validity was not changed: the certificate was not found." },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, message: "Certificate validity toggled" })
      }

      case "resend_certificate_email": {
        const { id } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A certificate id is required." }, { status: 400 })
        }

        // Email delivery RPCs mutate certificate rows through the service
        // role (see the 20261110160000 hardening), so this needs the admin
        // client; guard against missing configuration like the other cases.
        let adminClient: ReturnType<typeof createAdminClient>
        try {
          adminClient = createAdminClient()
        } catch (error: unknown) {
          logError("admin_action.admin_client_unavailable", error)
          return NextResponse.json(
            { error: "Certificate email sending is temporarily unavailable." },
            { status: 503 }
          )
        }

        // Release any stale sending leases before attempting retry
        await releaseStaleEmailLeases()

        // Fetch certificate with user email and PDF
        const { data: cert, error: certError } = await adminClient
          .from("certificates")
          .select("id, certificate_number, verification_code, recipient_name, user_id, course_title, issue_date, grade, storage_path, email_status, email_sent_at, email_error, email_retry_count")
          .eq("id", id)
          .maybeSingle()

        if (certError || !cert) {
          return NextResponse.json({ error: "Certificate not found." }, { status: 404 })
        }

        if (!cert.storage_path) {
          return NextResponse.json({ error: "Certificate PDF not available." }, { status: 400 })
        }

        if (!cert.user_id) {
          return NextResponse.json({ error: "Certificate has no associated user." }, { status: 400 })
        }

        // Check current email status
        if (cert.email_status === "sending") {
          return NextResponse.json({ error: "Certificate email is already being sent. Please wait." }, { status: 409 })
        }
        if (cert.email_status === "sent") {
          return NextResponse.json({ error: "Certificate email has already been sent successfully." }, { status: 409 })
        }

        // Enforce server-side retry limit. The UI shows the retry button only when
        // email_retry_count < 3, but the server must enforce this independently to
        // prevent bypassing the client-side guard. The counter is incremented by
        // complete_certificate_email_lease on every terminal outcome (sent or failed),
        // so a value of 3 means three full send attempts have already been made.
        const retryCheck = checkCertificateEmailRetryAllowed(cert.email_retry_count)
        if (!retryCheck.allowed) {
          return NextResponse.json({ error: retryCheck.error }, { status: retryCheck.status })
        }

        // Get learner email
        const { data: profile, error: profileError } = await adminClient
          .from("profiles")
          .select("email, full_name")
          .eq("id", cert.user_id)
          .maybeSingle()

        if (profileError || !profile?.email) {
          return NextResponse.json({ error: "Learner email not found." }, { status: 400 })
        }

        // Download PDF from storage
        const { data: fileData, error: downloadError } = await adminClient.storage
          .from("certificates")
          .download(cert.storage_path)

        if (downloadError || !fileData) {
          logError("certificate.pdf_download_failed", downloadError, { certificateId: id })
          return NextResponse.json({ error: "Certificate PDF could not be downloaded." }, { status: 503 })
        }

        const pdfBuffer = Buffer.from(await fileData.arrayBuffer())

        // Build verification URL
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        if (!siteUrl) {
          return NextResponse.json({ error: "Site URL not configured." }, { status: 503 })
        }
        const verificationUrl = new URL("/verify", siteUrl)
        verificationUrl.searchParams.set("code", cert.verification_code)

        // Send email with PDF attachment using atomic claiming
        // Use the stable per-certificate idempotency key shared with the
        // issuance path so Resend deduplicates across retries
        try {
          await claimAndSendCertificateEmail(adminClient, {
            certificateId: id,
            to: profile.email,
            recipientName: cert.recipient_name,
            courseTitle: cert.course_title,
            certificateNumber: cert.certificate_number,
            verificationUrl: verificationUrl.toString(),
            pdfBuffer,
            idempotencyKey: certificateEmailIdempotencyKey(id),
          })

          return NextResponse.json({ success: true, message: "Certificate email resent successfully." })
        } catch (emailError) {
          // claimAndSendCertificateEmail already updates status to failed
          logError("certificate.email_resend_failed", emailError, { certificateId: id })
          return NextResponse.json(
            { error: "Failed to send certificate email. Please try again." },
            { status: 503 }
          )
        }
      }

      case "grade_attempt_answer": {
        const { attempt_id, question_id, points, feedback } = payload

        const gradeUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!isNonEmptyString(attempt_id) || !gradeUuidPattern.test(attempt_id)) {
          return NextResponse.json({ error: "A valid attempt id is required." }, { status: 400 })
        }
        if (!isNonEmptyString(question_id) || !gradeUuidPattern.test(question_id)) {
          return NextResponse.json({ error: "A valid question id is required." }, { status: 400 })
        }
        if (typeof points !== "number" || !Number.isFinite(points) || points < 0) {
          return NextResponse.json(
            { error: "Points must be a non-negative number." },
            { status: 400 }
          )
        }
        if (feedback !== undefined && feedback !== null && !isOptionalText(feedback, 4000)) {
          return NextResponse.json(
            { error: "Feedback must be 4000 characters or fewer." },
            { status: 400 }
          )
        }

        const { data: attemptRow, error: attemptError } = await supabase
          .from("quiz_attempts")
          .select("id, user_id, status, quizzes(course_id)")
          .eq("id", attempt_id)
          .maybeSingle()

        if (attemptError) {
          return NextResponse.json(
            { error: genericDbError("Attempt lookup failed:", attemptError) },
            { status: 400 }
          )
        }
        if (!attemptRow) {
          return NextResponse.json({ error: "The attempt could not be found." }, { status: 404 })
        }
        if (attemptRow.status !== "pending_grading") {
          return NextResponse.json(
            { error: "Only attempts awaiting manual grading can be updated." },
            { status: 409 }
          )
        }

        const { data: gradeResult, error: gradeError } = await supabase.rpc("grade_attempt_answer", {
          p_attempt_id: attempt_id,
          p_question_id: question_id,
          p_points: points,
          p_feedback: typeof feedback === "string" ? feedback : null,
        })

        if (gradeError) {
          logError("admin_action.grade_attempt_answer_failed", gradeError, {
            attemptId: attempt_id,
            questionId: question_id,
          })
          return NextResponse.json(
            { error: "The answer could not be graded. Please try again." },
            { status: 400 }
          )
        }

        const courseId = attemptRow.quizzes?.course_id ?? null
        let completion = null
        if (courseId) {
          try {
            completion = await checkCourseCompletion(attemptRow.user_id, courseId)
          } catch (completionError) {
            logError("admin_action.grade_completion_failed", completionError, {
              attemptId: attempt_id,
              courseId,
            })
          }
        }

        return NextResponse.json({ success: true, result: gradeResult, completion })
      }

      case "update_message_status": {
        const { id, status } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A message id is required." }, { status: 400 })
        }
        if (!isOneOf(MESSAGE_STATUSES, status)) {
          return NextResponse.json({ error: "Invalid message status." }, { status: 400 })
        }

        const updateData: ContactMessageUpdate = { status }

        const { data: updated, error } = await supabase
          .from("contact_messages")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json(
            { error: genericDbError("Message status update failed:", error) },
            { status: 400 }
          )
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Message status was not changed: the message was not found." },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, message: "Message status updated" })
      }

      case "create_payment_request": {
        const { full_name, email, phone, amount, currency, method, reference, note, course_id, user_id } =
          payload

        if (!isNonEmptyText(full_name, 120) || full_name.trim().length < 2) {
          return NextResponse.json(
            { error: "A customer name of at least 2 characters is required." },
            { status: 400 }
          )
        }
        if (!isValidEmailAddress(email) || String(email).length > 200) {
          return NextResponse.json(
            { error: "A valid email address of up to 200 characters is required." },
            { status: 400 }
          )
        }
        const parsedAmount = typeof amount === "string" ? Number(amount) : amount
        if (
          typeof parsedAmount !== "number" ||
          !Number.isFinite(parsedAmount) ||
          parsedAmount < 0 ||
          parsedAmount > 99_999_999.99
        ) {
          return NextResponse.json(
            { error: "Amount must be between 0 and 99,999,999.99." },
            { status: 400 }
          )
        }
        if (phone !== undefined && phone !== null && !isOptionalText(phone, 40)) {
          return NextResponse.json({ error: "Phone must be 40 characters or fewer." }, { status: 400 })
        }
        if (method !== undefined && method !== null && !isOneOf(PAYMENT_METHODS, method)) {
          return NextResponse.json({ error: "Invalid payment method." }, { status: 400 })
        }
        if (reference !== undefined && reference !== null && !isOptionalText(reference, 120)) {
          return NextResponse.json({ error: "Reference must be 120 characters or fewer." }, { status: 400 })
        }
        if (note !== undefined && note !== null && !isOptionalText(note, 500)) {
          return NextResponse.json({ error: "Note must be 500 characters or fewer." }, { status: 400 })
        }

        if (currency !== undefined && currency !== null && !isNonEmptyString(currency)) {
          return NextResponse.json({ error: "Currency must be a string." }, { status: 400 })
        }
        const trimmedCurrency = isNonEmptyString(currency) ? currency.trim().toUpperCase() : "NGN"
        if (!/^[A-Z]{3}$/.test(trimmedCurrency)) {
          return NextResponse.json({ error: "Currency must be a 3-letter code." }, { status: 400 })
        }
        if (course_id !== undefined && course_id !== null && course_id !== "") {
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (!isNonEmptyString(course_id) || !uuidPattern.test(course_id)) {
            return NextResponse.json({ error: "Select a valid course." }, { status: 400 })
          }
        }
        if (user_id !== undefined && user_id !== null && user_id !== "") {
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
          if (!isNonEmptyString(user_id) || !uuidPattern.test(user_id)) {
            return NextResponse.json({ error: "Select a valid user." }, { status: 400 })
          }
        }

        const insertData: PaymentInsert = {
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          phone: isNonEmptyString(phone) ? phone.trim() : null,
          amount: Math.round(parsedAmount * 100) / 100,
          currency: trimmedCurrency,
          method: isOneOf(PAYMENT_METHODS, method) ? method : "bank_transfer",
          reference: isNonEmptyString(reference) ? reference.trim() : null,
          note: isNonEmptyString(note) ? note.trim() : null,
          course_id: isNonEmptyString(course_id) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(course_id) ? course_id : null,
          user_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(user_id ?? "")) ? String(user_id) : null,
          status: "pending",
        }

        const { data: created, error: insertError } = await supabase
          .from("payment_requests")
          .insert(insertData)
          .select("id")
          .single()

        if (insertError) {
          return NextResponse.json(
            { error: genericDbError("Payment request insert failed:", insertError) },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: "Payment request recorded",
          id: created.id,
        })
      }

      case "update_payment_status": {
        const { id, status, note, reference } = payload
        if (!isNonEmptyString(id) || !UUID_PATTERN.test(id)) {
          return NextResponse.json({ error: "A valid payment request id is required." }, { status: 400 })
        }
        if (!isOneOf(PAYMENT_STATUSES, status)) {
          return NextResponse.json({ error: "Invalid payment status." }, { status: 400 })
        }
        if (note !== undefined && note !== null && !isOptionalText(note, 500)) {
          return NextResponse.json({ error: "Note must be 500 characters or fewer." }, { status: 400 })
        }
        if (reference !== undefined && reference !== null && !isOptionalText(reference, 120)) {
          return NextResponse.json({ error: "Reference must be 120 characters or fewer." }, { status: 400 })
        }

        const nextStatus = status as PaymentStatus
        // The status transition and its matching course_enrollments write run
        // together in one SECURITY DEFINER transaction (guarded by is_admin),
        // so course access can never drift from the recorded payment state.
        const { error } = await supabase.rpc("update_payment_request_status", {
          p_payment_id: id,
          p_next_status: nextStatus,
          p_note: isNonEmptyString(note) ? note.trim() : null,
          p_reference: isNonEmptyString(reference) ? reference.trim() : null,
        })

        if (error) {
          logError("admin_action.payment_status_update_failed", error)
          const mapped = paymentStatusError(error)
          return NextResponse.json({ error: mapped.message }, { status: mapped.status })
        }

        const message =
          nextStatus === "confirmed"
            ? "Payment confirmed and course access granted."
            : nextStatus === "refunded"
              ? "Payment refunded and course access revoked."
              : "Payment declined."
        return NextResponse.json({ success: true, message })
      }

      case "create_user": {
        const { email, password, full_name, role } = payload
        if (
          !isNonEmptyString(email) ||
          !isNonEmptyString(password) ||
          (full_name !== undefined && full_name !== null && typeof full_name !== "string")
        ) {
          return NextResponse.json(
            { error: "Email and password are required; full name must be text when provided." },
            { status: 400 }
          )
        }
        const roleName = isNonEmptyString(role) ? role : "learner"
        const fullName = isNonEmptyString(full_name) ? full_name.trim() : null

        let adminSupabase
        try {
          adminSupabase = createAdminClient()
        } catch (error: unknown) {
          logError("admin_action.admin_client_unavailable", error)
          return NextResponse.json(
            { error: "User management is temporarily unavailable." },
            { status: 503 }
          )
        }

        const { data: roleData, error: roleError } = await adminSupabase
          .from("roles")
          .select("id")
          .eq("name", roleName)
          .single()

        if (roleError || !roleData) {
          return NextResponse.json({ error: "Role not found" }, { status: 400 })
        }

        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: fullName ? { full_name: fullName } : {},
        })

        if (authError || !authData.user) {
          logError("admin_action.create_user_failed", authError)
          return NextResponse.json(
            {
              error:
                "The user could not be created. The email may already be in use, or the password may not meet the requirements.",
            },
            { status: 400 }
          )
        }

        const newUserId = authData.user.id
        if (fullName) {
          const { data: createdProfile, error: profileReadError } = await adminSupabase
            .from("profiles")
            .select("full_name")
            .eq("id", newUserId)
            .single()

          if (profileReadError || !createdProfile) {
            logError("admin_action.created_user_profile_read_failed", profileReadError)
            return NextResponse.json(
              { error: "User was created, but its profile could not be verified." },
              { status: 503 }
            )
          }

          if (createdProfile.full_name !== fullName) {
            const { error: profileUpdateError } = await adminSupabase
              .from("profiles")
              .update({ full_name: fullName })
              .eq("id", newUserId)

            if (profileUpdateError) {
              logError("admin_action.created_user_profile_update_failed", profileUpdateError)
              return NextResponse.json(
                { error: "User was created, but the profile name could not be updated." },
                { status: 503 }
              )
            }
          }
        }

        const assignResult = await assignUserRole(adminSupabase, newUserId, roleData.id)

        if (assignResult.error) {
          logError("admin_action.created_user_role_assign_failed", assignResult.error)
          return NextResponse.json(
            {
              error: `User was created, but the role could not be assigned: ${assignResult.error}. Assign the role from the users list.`,
            },
            { status: assignResult.status ?? 503 }
          )
        }

        return NextResponse.json({ success: true, message: "User created successfully" })
      }

      case "update_user_role": {
        const { user_id, role } = payload
        if (!isNonEmptyString(user_id) || !isNonEmptyString(role)) {
          return NextResponse.json(
            { error: "A user id and role name are required." },
            { status: 400 }
          )
        }
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidPattern.test(user_id)) {
          return NextResponse.json({ error: "Select a valid user." }, { status: 400 })
        }
        if (user_id === admin.user.id) {
          return NextResponse.json(
            { error: "You cannot change your own role." },
            { status: 400 }
          )
        }

        let adminSupabase
        try {
          adminSupabase = createAdminClient()
        } catch (error: unknown) {
          logError("admin_action.admin_client_unavailable", error)
          return NextResponse.json(
            { error: "User management is temporarily unavailable." },
            { status: 503 }
          )
        }

        const { data: roleData, error: roleError } = await adminSupabase
          .from("roles")
          .select("id")
          .eq("name", role)
          .single()

        if (roleError || !roleData) {
          if (roleError && roleError.code !== "PGRST116") {
            return NextResponse.json(
              { error: genericDbError("Role lookup failed:", roleError) },
              { status: 503 }
            )
          }
          return NextResponse.json(
            { error: `Role was not changed: "${role}" is not a configured role.` },
            { status: 400 }
          )
        }

        const assignResult = await assignUserRole(adminSupabase, user_id, roleData.id)

        if (assignResult.error) {
          return NextResponse.json(
            { error: `Role was not changed: ${assignResult.error}` },
            { status: assignResult.status ?? 503 }
          )
        }

        return NextResponse.json({ success: true, message: "User role updated" })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    logError("admin_action.unhandled", error)
    return NextResponse.json({ error: "The operation could not be completed. Please try again." }, { status: 500 })
  }
}
