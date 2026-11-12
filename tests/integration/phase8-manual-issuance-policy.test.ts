import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import jsQR from "jsqr"
import type { Database } from "@/types/supabase"
import { issueCourseCertificate } from "@/lib/certificates/issueCertificate"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing Supabase credentials in test environment: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
const SITE_ORIGIN = new URL(requireEnv("NEXT_PUBLIC_SITE_URL")).origin

function createServiceClient() {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type DbClient = ReturnType<typeof createServiceClient>
type IdRow = { id: string }

let serviceClient: DbClient
let testUserId: string
let testUserEmail: string
let courseId: string
let moduleId: string
let lessonId: string

function requireId(data: IdRow | null, label: string): string {
  if (!data?.id) throw new Error(`${label} insert returned no id`)
  return data.id
}

async function decodeQrDataUrl(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl)
  const canvas = createCanvas(image.width, image.height)
  const context = canvas.getContext("2d")
  context.drawImage(image, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const decoded = jsQR(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  )
  if (!decoded) throw new Error("QR code could not be decoded")
  return decoded.data
}

async function deleteIssuedCertificates() {
  const { data: certificates } = await serviceClient
    .from("certificates")
    .select("id, storage_path")
    .eq("user_id", testUserId)

  for (const certificate of certificates ?? []) {
    if (certificate.storage_path) {
      await serviceClient.storage.from("certificates").remove([certificate.storage_path])
    }
  }

  await serviceClient.from("certificates").delete().eq("user_id", testUserId)
}

async function markCourseComplete() {
  const { error } = await serviceClient.from("lesson_progress").upsert({
    user_id: testUserId,
    lesson_id: lessonId,
    is_completed: true,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  expect(error).toBeNull()
}

describe("Phase 8: Manual certificate issuance policy (disposable project)", () => {
  beforeAll(async () => {
    serviceClient = createServiceClient()
    testUserEmail = `manual-issuance-${randomUUID()}@example.com`
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: testUserEmail,
      password: "test-password-123",
      email_confirm: true,
    })
    expect(authError).toBeNull()
    if (!authData.user?.id) throw new Error("Auth user creation returned no user")
    testUserId = authData.user.id

    const { error: profileError } = await serviceClient.from("profiles").upsert({
      id: testUserId,
      full_name: "Manual Issuance Learner",
      email: testUserEmail,
    })
    expect(profileError).toBeNull()
  }, 30000)

  afterAll(async () => {
    await deleteIssuedCertificates()
    await serviceClient.from("profiles").delete().eq("id", testUserId)
    await serviceClient.auth.admin.deleteUser(testUserId)
  }, 30000)

  beforeEach(async () => {
    const suffix = `test-${randomUUID()}`
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        title: "Manual Issuance Policy Course",
        slug: `${suffix}-course`,
        category: "test",
        duration: "4",
        short_description: "Policy test course",
        overview: "Policy test course for certificate issuance.",
        auto_issue_certificate: false,
      })
      .select("id")
      .single()
    expect(courseError).toBeNull()
    courseId = requireId(course, "course")

    const { data: courseModule, error: moduleError } = await serviceClient
      .from("course_modules")
      .insert({ course_id: courseId, title: "Policy Module", order_index: 1 })
      .select("id")
      .single()
    expect(moduleError).toBeNull()
    moduleId = requireId(courseModule, "module")

    const { data: lesson, error: lessonError } = await serviceClient
      .from("lessons")
      .insert({
        module_id: moduleId,
        title: "Policy Lesson",
        content_type: "text",
        duration_minutes: 20,
        order_index: 1,
        is_preview: false,
      })
      .select("id")
      .single()
    expect(lessonError).toBeNull()
    lessonId = requireId(lesson, "lesson")

    const { error: enrollmentError } = await serviceClient.from("course_enrollments").insert({
      user_id: testUserId,
      course_id: courseId,
      status: "active",
      progress_percent: 0,
    })
    expect(enrollmentError).toBeNull()
  }, 30000)

  afterEach(async () => {
    await deleteIssuedCertificates()
    await serviceClient
      .from("lesson_progress")
      .delete()
      .eq("user_id", testUserId)
      .eq("lesson_id", lessonId)
    await serviceClient
      .from("course_enrollments")
      .delete()
      .eq("user_id", testUserId)
      .eq("course_id", courseId)
    await serviceClient.from("lessons").delete().eq("id", lessonId)
    await serviceClient.from("course_modules").delete().eq("id", moduleId)
    await serviceClient.from("courses").delete().eq("id", courseId)
  }, 30000)

  describe("course-linked issuance", () => {
    it("issues only after server-verified enrollment and completion", async () => {
      await markCourseComplete()

      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId,
        courseTitle: "Spoofed client title",
        recipientName: "Manual Issuance Learner",
      })

      expect(result.status).toBe("created")
      if (result.status !== "created") return

      expect(result.certificate.certificate_type).toBe("course_linked")
      expect(result.certificate.issuance_reason).toBeNull()
      expect(result.certificate.course_id).toBe(courseId)
      expect(result.certificate.course_title).toBe("Manual Issuance Policy Course")
      expect(result.certificate.storage_path).toBeTruthy()
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/)

      const decodedUrl = new URL(await decodeQrDataUrl(result.qrCode))
      expect(decodedUrl.origin).toBe(SITE_ORIGIN)
      expect(decodedUrl.pathname).toBe("/verify")
      expect(decodedUrl.searchParams.get("code")).toBe(result.certificate.verification_code)
    })

    it("rejects course-linked issuance when the learner is not enrolled", async () => {
      await markCourseComplete()
      await serviceClient
        .from("course_enrollments")
        .delete()
        .eq("user_id", testUserId)
        .eq("course_id", courseId)

      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId,
        recipientName: "Manual Issuance Learner",
      })

      expect(result.status).toBe("error")
      if (result.status !== "error") return
      expect(result.code).toBe("not_eligible")

      const { data: certificates } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
      expect(certificates).toHaveLength(0)
    })

    it("rejects course-linked issuance before server-verified completion", async () => {
      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId,
        recipientName: "Manual Issuance Learner",
      })

      expect(result.status).toBe("error")
      if (result.status !== "error") return
      expect(result.code).toBe("not_complete")

      const { data: certificates } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
      expect(certificates).toHaveLength(0)
    })

    it("does not mint a duplicate on repeated issuance", async () => {
      await markCourseComplete()

      const first = await issueCourseCertificate({
        userId: testUserId,
        courseId,
        recipientName: "Manual Issuance Learner",
      })
      expect(first.status).toBe("created")
      if (first.status !== "created") return

      const second = await issueCourseCertificate({
        userId: testUserId,
        courseId,
        recipientName: "Manual Issuance Learner",
      })
      expect(second.status).toBe("existing")
      if (second.status !== "existing") return

      expect(second.certificate.id).toBe(first.certificate.id)
      expect(second.qrCode).toMatch(/^data:image\/png;base64,/)

      const { data: certificates } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
        .eq("course_id", courseId)
      expect(certificates).toHaveLength(1)
    })
  })

  describe("independent manual issuance", () => {
    it("writes the required success audit atomically and does not duplicate it on retry", async () => {
      const input = {
        userId: testUserId,
        courseId: null,
        courseTitle: "Audited Independent Community Award",
        recipientName: "Manual Issuance Learner",
        issuanceReason: "Recognised for outstanding community facilitation.",
        mandatoryIndependentAuditActorId: testUserId,
      }

      const first = await issueCourseCertificate(input)
      expect(first.status).toBe("created")
      if (first.status === "error") return

      const { data: audits, error: auditError } = await serviceClient
        .from("admin_audit_log")
        .select("id, actor_id, target, outcome, details")
        .eq("action", "issue_certificate")
        .eq("target", first.certificate.id)
      expect(auditError).toBeNull()
      expect(audits).toHaveLength(1)
      expect(audits?.[0]).toMatchObject({
        actor_id: testUserId,
        target: first.certificate.id,
        outcome: "success",
      })
      expect(audits?.[0].details).toMatchObject({
        certificate_type: "independent",
        recipient_user_id: testUserId,
        reason: input.issuanceReason,
      })

      const retry = await issueCourseCertificate(input)
      expect(retry.status).toBe("existing")
      if (retry.status === "error") return
      expect(retry.certificate.id).toBe(first.certificate.id)

      const { data: retryAudits, error: retryAuditError } = await serviceClient
        .from("admin_audit_log")
        .select("id")
        .eq("action", "issue_certificate")
        .eq("target", first.certificate.id)
      expect(retryAuditError).toBeNull()
      expect(retryAudits).toHaveLength(1)
    })

    it("rolls back certificate creation when the mandatory audit insert fails", async () => {
      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId: null,
        courseTitle: "Audit Failure Community Award",
        recipientName: "Manual Issuance Learner",
        issuanceReason: "This must fail together with its audit row.",
        mandatoryIndependentAuditActorId: randomUUID(),
      })

      expect(result.status).toBe("error")
      if (result.status === "error") expect(result.code).toBe("insert")

      const { data: certificates, error } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
        .eq("course_title", "Audit Failure Community Award")
      expect(error).toBeNull()
      expect(certificates).toHaveLength(0)
    })

    it("rejects invalid direct database inserts while preserving valid course context", async () => {
      const base = {
        recipient_name: "Manual Issuance Learner",
        user_id: testUserId,
        course_title: "Direct Database Constraint Test",
        issue_date: "2026-11-12",
        verification_code: `TG-DIRECT-${randomUUID().slice(0, 8).toUpperCase()}`,
      }

      const missingReason = await serviceClient.from("certificates").insert({
        ...base,
        certificate_type: "independent",
        course_id: null,
        issuance_reason: null,
      })
      expect(missingReason.error?.code).toBe("23514")

      const whitespaceReason = await serviceClient.from("certificates").insert({
        ...base,
        verification_code: `TG-DIRECT-${randomUUID().slice(0, 8).toUpperCase()}`,
        certificate_type: "independent",
        course_id: null,
        issuance_reason: "   ",
      })
      expect(whitespaceReason.error?.code).toBe("23514")

      const overlongReason = await serviceClient.from("certificates").insert({
        ...base,
        verification_code: `TG-DIRECT-${randomUUID().slice(0, 8).toUpperCase()}`,
        certificate_type: "independent",
        course_id: null,
        issuance_reason: "x".repeat(501),
      })
      expect(overlongReason.error?.code).toBe("23514")

      const independentWithCourse = await serviceClient.from("certificates").insert({
        ...base,
        verification_code: `TG-DIRECT-${randomUUID().slice(0, 8).toUpperCase()}`,
        certificate_type: "independent",
        course_id: courseId,
        issuance_reason: "Independent certificates cannot be course-linked.",
      })
      expect(independentWithCourse.error?.code).toBe("23514")

      const courseLinkedWithoutCourse = await serviceClient.from("certificates").insert({
        ...base,
        verification_code: `TG-DIRECT-${randomUUID().slice(0, 8).toUpperCase()}`,
        certificate_type: "course_linked",
        course_id: null,
        issuance_reason: null,
      })
      expect(courseLinkedWithoutCourse.error?.code).toBe("23514")
    })

    it("requires an explicit reason", async () => {
      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId: null,
        courseTitle: "Independent Community Award",
        recipientName: "Manual Issuance Learner",
      })

      expect(result.status).toBe("error")
      if (result.status !== "error") return
      expect(result.code).toBe("reason_required")

      const { data: certificates } = await serviceClient
        .from("certificates")
        .select("id")
        .eq("user_id", testUserId)
      expect(certificates).toHaveLength(0)
    })

    it("issues a distinct independent certificate with the stored reason", async () => {
      const reason = "Recognised for outstanding community facilitation."
      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId: null,
        courseTitle: "Independent Community Award",
        recipientName: "Manual Issuance Learner",
        issuanceReason: reason,
      })

      expect(result.status).toBe("created")
      if (result.status !== "created") return

      expect(result.certificate.certificate_type).toBe("independent")
      expect(result.certificate.course_id).toBeNull()
      expect(result.certificate.issuance_reason).toBe(reason)
      expect(result.certificate.course_title).toBe("Independent Community Award")
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/)

      const decodedUrl = new URL(await decodeQrDataUrl(result.qrCode))
      expect(decodedUrl.origin).toBe(SITE_ORIGIN)
      expect(decodedUrl.pathname).toBe("/verify")
      expect(decodedUrl.searchParams.get("code")).toBe(result.certificate.verification_code)
    })

    it("rejects a reason longer than 500 characters", async () => {
      const result = await issueCourseCertificate({
        userId: testUserId,
        courseId: null,
        courseTitle: "Independent Community Award",
        recipientName: "Manual Issuance Learner",
        issuanceReason: "x".repeat(501),
      })

      expect(result.status).toBe("error")
      if (result.status !== "error") return
      expect(result.code).toBe("reason_required")
    })
  })
})
