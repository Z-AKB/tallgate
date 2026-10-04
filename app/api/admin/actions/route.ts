import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { readFile } from "fs/promises"
import path from "path"
import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdminApi } from "@/lib/auth/guards"
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

type ConsultationStatus = Database["public"]["Tables"]["consultation_requests"]["Row"]["status"]
type StartupApplicationStatus = Database["public"]["Tables"]["startup_applications"]["Row"]["status"]
type MessageStatus = Database["public"]["Tables"]["contact_messages"]["Row"]["status"]

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

type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"]

type IssuedCertificate = Pick<
  CertificateRow,
  | "id"
  | "certificate_number"
  | "verification_code"
  | "recipient_name"
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
    console.warn("Certificate logo could not be loaded; issuing without it:", error)
    return undefined
  }
}

function buildCertificateStoragePath() {
  const token = randomBytes(24).toString("hex")
  return `${token.slice(0, 2)}/${token.slice(2, 4)}/${token}.${CERTIFICATE_FILE_NAME.split(".").pop()}`
}

async function rollbackCertificate(
  supabase: ReturnType<typeof createClient>,
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

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminApi()
    if (admin.error) return admin.error

    const body: unknown = await req.json()
    if (!isRecord(body)) {
      return NextResponse.json({ error: "A valid action payload is required." }, { status: 400 })
    }

    const { action, payload } = body
    if (typeof action !== "string" || !action.trim()) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }
    if (!isRecord(payload)) {
      return NextResponse.json({ error: "A valid action payload is required." }, { status: 400 })
    }

    const supabase = createClient()

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

        const { error } = await supabase.from("courses").update(updateData).eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
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

        const { error } = await supabase.from("courses").update(updateData).eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Course popularity updated" })
      }

      case "issue_certificate": {
        const {
          recipient_name,
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
          typeof recipient_name !== "string" ||
          !recipient_name.trim() ||
          recipient_name.trim().length > 200 ||
          typeof course_title !== "string" ||
          !course_title.trim() ||
          course_title.trim().length > 200
        ) {
          return NextResponse.json(
            { error: "Recipient name and course title are required." },
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
        if (
          !["http:", "https:"].includes(baseUrl.protocol) ||
          (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:")
        ) {
          return NextResponse.json(
            { error: "NEXT_PUBLIC_SITE_URL must use HTTPS in production." },
            { status: 500 }
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

        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        for (const [field, value] of [["course_id", course_id], ["user_id", user_id]] as const) {
          if (value !== undefined && value !== null && value !== "" &&
              (typeof value !== "string" || !uuidPattern.test(value))) {
            return NextResponse.json({ error: `${field} must be a valid UUID.` }, { status: 400 })
          }
        }

        const certificateInput: Omit<CertificateInsert, "verification_code"> = {
          recipient_name: recipient_name.trim(),
          course_title: course_title.trim(),
          grade: typeof grade === "string" && grade.trim() ? grade.trim().slice(0, 100) : "Distinction",
          issue_date: issueDate,
          is_valid: true,
          ...(typeof course_id === "string" && course_id ? { course_id } : {}),
          ...(typeof user_id === "string" && user_id ? { user_id } : {}),
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
              "id, certificate_number, verification_code, recipient_name, course_title, issue_date, grade, is_valid, created_at"
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

      case "create_user": {
        const { email, password, full_name, role } = payload
        if (!isNonEmptyString(email) || !isNonEmptyString(password) || !isNonEmptyString(full_name)) {
          return NextResponse.json(
            { error: "Email, password and full name are required." },
            { status: 400 }
          )
        }
        const roleName = isNonEmptyString(role) ? role : "learner"

        let adminSupabase
        try {
          adminSupabase = createAdminClient()
        } catch (error: unknown) {
          return NextResponse.json({ error: getErrorMessage(error) }, { status: 503 })
        }

        // 1. Create auth user
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        })

        if (authError || !authData.user) {
          return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 })
        }
        const newUserId = authData.user.id

        // 2. Create profile
        const { error: profileError } = await adminSupabase.from("profiles").insert({
          id: newUserId,
          full_name,
          email
        })

        if (profileError) {
          return NextResponse.json({ error: profileError.message }, { status: 400 })
        }

        // 3. Assign role
        const { data: roleData, error: roleError } = await adminSupabase
          .from("roles")
          .select("id")
          .eq("name", roleName)
          .single()

      if (roleError || !roleData) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 })
      }

      const { error: assignError } = await adminSupabase.from("user_roles").insert({
        user_id: newUserId,
        role_id: roleData.id
      })

      if (assignError) {
        return NextResponse.json({ error: assignError.message }, { status: 400 })
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
          return NextResponse.json({ error: "Role not found" }, { status: 400 })
        }

        await adminSupabase.from("user_roles").delete().eq("user_id", user_id)
        const { error } = await adminSupabase.from("user_roles").insert({
          user_id,
          role_id: roleData.id
        })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
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
