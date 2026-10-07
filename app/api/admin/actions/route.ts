import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { readFile } from "fs/promises"
import path from "path"
import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/auth/guards"
import { readJsonObject, isValidEmailAddress, isNonEmptyText, isOptionalText } from "@/lib/api/request"
import { renderCertificatePdf } from "@/lib/certificates/generateCertificatePdf"
import type { Database } from "@/types/supabase"
import { getErrorMessage, isNonEmptyString, isOneOf, isRecord } from "@/lib/utils"

export const runtime = "nodejs"

const CERTIFICATE_BUCKET = "certificates"
const CERTIFICATE_CONTENT_TYPE = "application/pdf"
const CERTIFICATE_FILE_NAME = "certificate.pdf"

type ConsultationUpdate = Database["public"]["Tables"]["consultation_requests"]["Update"]
type StartupApplicationUpdate = Database["public"]["Tables"]["startup_applications"]["Update"]
type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"]
type CertificateUpdate = Database["public"]["Tables"]["certificates"]["Update"]
type ContactMessageUpdate = Database["public"]["Tables"]["contact_messages"]["Update"]
type CertificateInsert = Database["public"]["Tables"]["certificates"]["Insert"]
type PaymentInsert = Database["public"]["Tables"]["payment_requests"]["Insert"]
type PaymentUpdate = Database["public"]["Tables"]["payment_requests"]["Update"]

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

type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"]

type IssuedCertificate = Pick<
  CertificateRow,
  | "id"
  | "certificate_number"
  | "verification_code"
  | "recipient_name"
  | "user_id"
  | "course_title"
  | "issue_date"
  | "grade"
  | "is_valid"
  | "created_at"
>

async function loadCertificateLogo(): Promise<string | undefined> {
  try {
    const filePath = path.join(process.cwd(), "public", "assets", "tallgate-logo.png")
    const buffer = await readFile(filePath)
    return `data:image/png;base64,${buffer.toString("base64")}`
  } catch (error) {
    // Issuance still succeeds, but the PDF is produced without the brand logo.
    // Logged as an error because this is a silent degradation of the output.
    console.error("Certificate logo could not be loaded; issuing without it:", error)
    return undefined
  }
}

function buildCertificateStoragePath() {
  const token = randomBytes(24).toString("hex")
  return `${token.slice(0, 2)}/${token.slice(2, 4)}/${token}.${CERTIFICATE_FILE_NAME.split(".").pop()}`
}

async function rollbackCertificate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  certificateId: string
) {
  const { error } = await supabase.from("certificates").delete().eq("id", certificateId)
  if (error) {
    console.error(`Failed to roll back certificate ${certificateId}:`, error)
  }
}

async function removeCertificateFile(
  storageClient: ReturnType<typeof createAdminClient>,
  storagePath: string
) {
  const { error } = await storageClient.storage.from(CERTIFICATE_BUCKET).remove([storagePath])
  if (error) {
    console.error(`Failed to remove orphaned certificate file ${storagePath}:`, error)
  }
}

type RoleAssignmentResult = { error: null; status?: undefined } | { error: string; status: 400 | 503 }

/**
 * Replaces a user's single role assignment without relying on an
 * `on conflict (user_id)` target: the composite `unique(user_id, role_id)`
 * constraint and the later `unique(user_id)` constraint make upserts either
 * ambiguous or impossible on databases where the follow-up migration has not
 * been applied. Reads, deletes and inserts explicitly instead so the write
 * succeeds on both schema revisions and collapses any duplicate assignments
 * left behind by older upserts.
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
    console.error("Role assignment profile lookup failed:", profileError)
    return { error: profileError.message, status: 503 }
  }
  if (!profile) {
    return { error: "This user's profile no longer exists, so the role cannot be assigned.", status: 400 }
  }

  const { data: assignments, error: readError } = await adminSupabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)

  if (readError) {
    console.error("Role assignment lookup failed:", readError)
    return { error: readError.message, status: 503 }
  }

  const existing = assignments ?? []
  if (existing.length === 1 && existing[0].role_id === roleId) {
    return { error: null }
  }

  if (existing.length > 0) {
    const { error: deleteError } = await adminSupabase.from("user_roles").delete().eq("user_id", userId)
    if (deleteError) {
      console.error("Role assignment cleanup failed:", deleteError)
      return { error: deleteError.message, status: 503 }
    }
  }

  const { error: insertError } = await adminSupabase
    .from("user_roles")
    .insert({ user_id: userId, role_id: roleId })

  if (insertError) {
    console.error("Role assignment insert failed:", insertError)
    if (existing.length > 0) {
      const { error: restoreError } = await adminSupabase.from("user_roles").insert(
        existing.map((row) => ({ user_id: userId, role_id: row.role_id }))
      )
      if (restoreError) {
        console.error("Failed to restore the previous role assignment:", restoreError)
      }
    }
    return { error: insertError.message, status: 503 }
  }

  return { error: null }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminApi()
    if (admin.error) return admin.error

    const parsed = await readJsonObject(req)
    if (parsed.response) return parsed.response

    const { action, payload } = parsed.data
    if (typeof action !== "string" || !action.trim()) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }
    if (!isRecord(payload)) {
      return NextResponse.json({ error: "A valid action payload is required." }, { status: 400 })
    }

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
        if (admin_notes !== undefined && admin_notes !== null && typeof admin_notes !== "string") {
          return NextResponse.json({ error: "Admin notes must be a string." }, { status: 400 })
        }

        const updateData: ConsultationUpdate = { status, updated_at: new Date().toISOString() }
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes

        const { error } = await supabase
          .from("consultation_requests")
          .update(updateData)
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
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

        const { error } = await supabase
          .from("startup_applications")
          .update(updateData)
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
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
          return NextResponse.json({ error: error.message }, { status: 400 })
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
          return NextResponse.json({ error: error.message }, { status: 400 })
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
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Course domain was not changed: the update matched no rows. Check that the admin course update migration has been applied." },
            { status: 409 }
          )
        }
        return NextResponse.json({ success: true, message: "Course domain updated" })
      }

      case "issue_certificate": {
        const {
          course_title,
          course_id,
          user_id,
          verification_code,
          grade,
          issue_date,
        } = payload

        if (verification_code !== undefined) {
          return NextResponse.json(
            { error: "Verification codes are generated by the server." },
            { status: 400 }
          )
        }

        if (
          !isNonEmptyString(user_id) ||
          typeof course_title !== "string" ||
          !course_title.trim() ||
          course_title.trim().length > 200
        ) {
          return NextResponse.json(
            { error: "Select a learner account and provide a course title." },
            { status: 400 }
          )
        }

        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidPattern.test(user_id)) {
          return NextResponse.json({ error: "Select a valid learner account." }, { status: 400 })
        }

        let certificateAdminClient: ReturnType<typeof createAdminClient>
        try {
          certificateAdminClient = createAdminClient()
        } catch (error: unknown) {
          console.error("Certificate learner lookup is unavailable:", error)
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
          console.error("Certificate issuance could not resolve learner role:", learnerRoleError)
          return NextResponse.json({ error: "Learner accounts could not be verified." }, { status: 503 })
        }

        const [{ data: learnerProfile, error: profileError }, { data: roleAssignment, error: assignmentError }] =
          await Promise.all([
            certificateAdminClient
              .from("profiles")
              .select("full_name")
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
          console.error("Certificate learner account verification failed:", { profileError, assignmentError })
          return NextResponse.json({ error: "Learner account could not be verified." }, { status: 503 })
        }
        if (!learnerProfile || !roleAssignment) {
          return NextResponse.json(
            { error: "Certificates can only be issued to existing learner accounts." },
            { status: 400 }
          )
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        if (!siteUrl) {
          return NextResponse.json(
            { error: "Set NEXT_PUBLIC_SITE_URL before issuing certificates." },
            { status: 503 }
          )
        }

        let baseUrl: URL
        try {
          baseUrl = new URL(siteUrl)
        } catch {
          return NextResponse.json(
            { error: "NEXT_PUBLIC_SITE_URL must be a valid absolute URL." },
            { status: 500 }
          )
        }
        const hostname = baseUrl.hostname.toLowerCase()
        const isLocalHostname =
          hostname === "localhost" ||
          hostname.endsWith(".localhost") ||
          hostname.endsWith(".local") ||
          hostname.endsWith(".test") ||
          hostname === "0.0.0.0" ||
          /^127(?:\.\d{1,3}){3}$/.test(hostname) ||
          hostname === "[::1]"
        if (
          baseUrl.protocol !== "https:" ||
          isLocalHostname ||
          baseUrl.username ||
          baseUrl.password ||
          baseUrl.pathname !== "/" ||
          baseUrl.search ||
          baseUrl.hash
        ) {
          return NextResponse.json(
            {
              error:
                "NEXT_PUBLIC_SITE_URL must be a public HTTPS origin, not localhost or a development URL.",
            },
            { status: 503 }
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

        for (const [field, value] of [["course_id", course_id]] as const) {
          if (value !== undefined && value !== null && value !== "" &&
              (typeof value !== "string" || !uuidPattern.test(value))) {
            return NextResponse.json({ error: `${field} must be a valid UUID.` }, { status: 400 })
          }
        }

        const certificateInput: Omit<CertificateInsert, "verification_code"> = {
          recipient_name: learnerProfile.full_name,
          user_id,
          course_title: course_title.trim(),
          grade: typeof grade === "string" && grade.trim() ? grade.trim().slice(0, 100) : "Distinction",
          issue_date: issueDate,
          is_valid: true,
          ...(typeof course_id === "string" && course_id ? { course_id } : {}),
        }

        let issuedCertificate: IssuedCertificate | null = null
        let generatedCode = ""
        let verificationUrlString = ""
        let qrCode = ""
        let insertError: { code?: string; message: string } | null = null

        for (let attempt = 0; attempt < 3; attempt++) {
          generatedCode = `TG-${new Date().getFullYear()}-${randomBytes(12)
            .toString("hex")
            .toUpperCase()}`
          const verificationUrl = new URL("/verify", baseUrl)
          verificationUrl.searchParams.set("code", generatedCode)
          verificationUrlString = verificationUrl.toString()
          qrCode = await QRCode.toDataURL(verificationUrlString, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 320,
          })

          const { data, error } = await supabase
            .from("certificates")
            .insert({ ...certificateInput, verification_code: generatedCode })
            .select(
              "id, certificate_number, verification_code, user_id, recipient_name, course_title, issue_date, grade, is_valid, created_at"
            )
            .single()

          if (!error) {
            issuedCertificate = data
            insertError = null
            break
          }

          insertError = error
          if (error.code !== "23505") break
        }

        if (insertError || !issuedCertificate) {
          console.error("Certificate issuance failed:", insertError)
          return NextResponse.json(
            { error: "Certificate could not be issued. Please try again." },
            { status: 503 }
          )
        }

        const storagePath = buildCertificateStoragePath()
        let storageClient: ReturnType<typeof createAdminClient>
        try {
          storageClient = createAdminClient()
        } catch (error) {
          console.error("Service role client unavailable for certificate upload:", error)
          await rollbackCertificate(supabase, issuedCertificate.id)
          return NextResponse.json(
            { error: "Certificate could not be issued. Storage is not configured." },
            { status: 503 }
          )
        }

        let pdfBuffer: Buffer
        try {
          pdfBuffer = await renderCertificatePdf({
            recipient_name: issuedCertificate.recipient_name,
            course_title: issuedCertificate.course_title,
            issue_date: issuedCertificate.issue_date,
            grade: issuedCertificate.grade,
            certificate_number: issuedCertificate.certificate_number,
            verification_code: issuedCertificate.verification_code,
            verification_url: verificationUrlString,
            qr_data_url: qrCode,
            logo_src: await loadCertificateLogo(),
          })
        } catch (error) {
          console.error("Certificate PDF generation failed:", error)
          await rollbackCertificate(supabase, issuedCertificate.id)
          return NextResponse.json(
            { error: "Certificate could not be issued. PDF generation failed." },
            { status: 503 }
          )
        }

        const { error: uploadError } = await storageClient.storage
          .from(CERTIFICATE_BUCKET)
          .upload(storagePath, pdfBuffer, {
            contentType: CERTIFICATE_CONTENT_TYPE,
            upsert: false,
          })

        if (uploadError) {
          console.error("Certificate PDF upload failed:", uploadError)
          await rollbackCertificate(supabase, issuedCertificate.id)
          return NextResponse.json(
            { error: "Certificate could not be issued. PDF upload failed." },
            { status: 503 }
          )
        }

        const { error: persistError } = await supabase
          .from("certificates")
          .update({ storage_path: storagePath })
          .eq("id", issuedCertificate.id)

        if (persistError) {
          console.error("Certificate storage path could not be persisted:", persistError)
          await removeCertificateFile(storageClient, storagePath)
          await rollbackCertificate(supabase, issuedCertificate.id)
          return NextResponse.json(
            { error: "Certificate could not be issued. Please try again." },
            { status: 503 }
          )
        }

        return NextResponse.json({
          success: true,
          certificate: { ...issuedCertificate, storage_path: storagePath },
          verification_url: verificationUrlString,
          qr_code: qrCode,
          download_url: `/api/admin/certificates/${issuedCertificate.id}/download`,
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

        const { error } = await supabase.from("certificates").update(updateData).eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Certificate validity toggled" })
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

        const { error } = await supabase.from("contact_messages").update(updateData).eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Message status updated" })
      }

      case "create_payment_request": {
        const { full_name, email, phone, amount, currency, method, reference, note, course_id, user_id } =
          payload

        if (!isNonEmptyText(full_name, 120) || !isValidEmailAddress(email)) {
          return NextResponse.json(
            { error: "A customer name and a valid email address are required." },
            { status: 400 }
          )
        }
        const parsedAmount = typeof amount === "string" ? Number(amount) : amount
        if (typeof parsedAmount !== "number" || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
          return NextResponse.json(
            { error: "Enter an amount of zero or more." },
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

        let linkedUserId: string | null = isNonEmptyString(user_id) ? user_id : null
        if (!linkedUserId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email.trim().toLowerCase())
            .maybeSingle()
          linkedUserId = profile?.id ?? null
        }

        const insertData: PaymentInsert = {
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          phone: isNonEmptyString(phone) ? phone.trim() : null,
          amount: Math.round(parsedAmount * 100) / 100,
          currency: isNonEmptyString(currency) ? currency.trim().toUpperCase().slice(0, 3) : "NGN",
          method: isOneOf(PAYMENT_METHODS, method) ? method : "bank_transfer",
          reference: isNonEmptyString(reference) ? reference.trim() : null,
          note: isNonEmptyString(note) ? note.trim() : null,
          course_id: isNonEmptyString(course_id) ? course_id : null,
          user_id: linkedUserId,
          status: "pending",
        }

        const { data: created, error: insertError } = await supabase
          .from("payment_requests")
          .insert(insertData)
          .select("id")
          .single()

        if (insertError) {
          console.error("Payment request insert failed:", insertError)
          return NextResponse.json({ error: insertError.message }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: "Payment request recorded",
          id: created.id,
        })
      }

      case "update_payment_status": {
        const { id, status, note, reference } = payload
        if (!isNonEmptyString(id)) {
          return NextResponse.json({ error: "A payment request id is required." }, { status: 400 })
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

        const updateData: PaymentUpdate = {
          status,
          updated_at: new Date().toISOString(),
          reviewed_by: admin.user.id,
          reviewed_at: new Date().toISOString(),
        }
        if (note !== undefined) updateData.note = isNonEmptyString(note) ? note.trim() : null
        if (reference !== undefined) {
          updateData.reference = isNonEmptyString(reference) ? reference.trim() : null
        }

        const { data: updated, error } = await supabase
          .from("payment_requests")
          .update(updateData)
          .eq("id", id)
          .select("id")
          .maybeSingle()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (!updated) {
          return NextResponse.json(
            { error: "Payment status was not changed: the request was not found." },
            { status: 404 }
          )
        }
        return NextResponse.json({ success: true, message: "Payment status updated" })
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
          return NextResponse.json({ error: getErrorMessage(error) }, { status: 503 })
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
          return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 })
        }

        const newUserId = authData.user.id
        if (fullName) {
          const { data: createdProfile, error: profileReadError } = await adminSupabase
            .from("profiles")
            .select("full_name")
            .eq("id", newUserId)
            .single()

          if (profileReadError || !createdProfile) {
            console.error("Created user's trigger-managed profile could not be read:", profileReadError)
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
              console.error("Created user's profile name could not be updated:", profileUpdateError)
              return NextResponse.json(
                { error: "User was created, but the profile name could not be updated." },
                { status: 503 }
              )
            }
          }
        }

        const { error: assignError } = await assignUserRole(adminSupabase, newUserId, roleData.id)

        if (assignError) {
          console.error("Created user's role could not be assigned:", assignError)
          return NextResponse.json(
            { error: `User was created, but the role could not be assigned: ${assignError}` },
            { status: 503 }
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

        let adminSupabase
        try {
          adminSupabase = createAdminClient()
        } catch (error: unknown) {
          return NextResponse.json({ error: getErrorMessage(error) }, { status: 503 })
        }

        const { data: roleData, error: roleError } = await adminSupabase
          .from("roles")
          .select("id")
          .eq("name", role)
          .single()

        if (roleError || !roleData) {
          if (roleError && roleError.code !== "PGRST116") {
            console.error("Role lookup failed:", roleError)
            return NextResponse.json(
              { error: `Role was not changed: ${roleError.message}` },
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
    console.error("Admin action API error:", error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  }
}
