import { randomUUID } from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing Supabase credentials in test environment: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

const CERTIFICATE_BUCKET = "certificates"

function createServiceClient() {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type DbClient = ReturnType<typeof createServiceClient>
type IdRow = { id: string }
function requireId(data: IdRow | null, label: string): string {
  if (!data?.id) throw new Error(`${label} insert returned no id`)
  return data.id
}

describe("Phase 4: Private storage and download integration (disposable project)", () => {
  let serviceClient: DbClient
  let ownerUserId: string
  let otherUserId: string
  let ownerCertificateId: string
  let otherCertificateId: string
  let ownerStoragePath: string
  let otherStoragePath: string

  beforeAll(async () => {
    serviceClient = createServiceClient()

    const ownerEmail = `download-owner-${randomUUID()}@example.com`
    const otherEmail = `download-other-${randomUUID()}@example.com`
    const password = "test-password-123"

    const { data: ownerAuth, error: ownerAuthError } = await serviceClient.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
    })
    expect(ownerAuthError).toBeNull()
    if (!ownerAuth.user?.id) throw new Error("owner auth user missing")
    ownerUserId = ownerAuth.user.id

    const { data: otherAuth, error: otherAuthError } = await serviceClient.auth.admin.createUser({
      email: otherEmail,
      password,
      email_confirm: true,
    })
    expect(otherAuthError).toBeNull()
    if (!otherAuth.user?.id) throw new Error("other auth user missing")
    otherUserId = otherAuth.user.id

    await serviceClient.from("profiles").upsert([
      { id: ownerUserId, full_name: "Certificate Owner", email: ownerEmail },
      { id: otherUserId, full_name: "Other Learner", email: otherEmail },
    ])

    const { data: ownerCert, error: ownerCertError } = await serviceClient
      .from("certificates")
      .insert({
        verification_code: `TG-DL-OWN-${randomUUID().slice(0, 8).toUpperCase()}`,
        user_id: ownerUserId,
        course_id: null,
        certificate_type: "independent",
        issuance_reason: "Storage download integration fixture",
        recipient_name: "Certificate Owner",
        course_title: "Download Test Course",
        email_status: "sent",
        storage_path: null,
        is_valid: true,
      })
      .select("id")
      .single()
    expect(ownerCertError).toBeNull()
    ownerCertificateId = requireId(ownerCert, "owner certificate")

    const { data: otherCert, error: otherCertError } = await serviceClient
      .from("certificates")
      .insert({
        verification_code: `TG-DL-OTH-${randomUUID().slice(0, 8).toUpperCase()}`,
        user_id: otherUserId,
        course_id: null,
        certificate_type: "independent",
        issuance_reason: "Storage download integration fixture",
        recipient_name: "Other Learner",
        course_title: "Download Test Course",
        email_status: "sent",
        storage_path: null,
        is_valid: true,
      })
      .select("id")
      .single()
    expect(otherCertError).toBeNull()
    otherCertificateId = requireId(otherCert, "other certificate")

    ownerStoragePath = `certificates/${ownerUserId}/${ownerCertificateId}.pdf`
    otherStoragePath = `certificates/${otherUserId}/${otherCertificateId}.pdf`
    const pdfBuffer = Buffer.from("%PDF-1.4\n%Test PDF content for certificate download test\n%%EOF")

    const { error: uploadError } = await serviceClient.storage
      .from(CERTIFICATE_BUCKET)
      .upload(ownerStoragePath, pdfBuffer, { contentType: "application/pdf", upsert: true })
    expect(uploadError).toBeNull()

    const { error: persistError } = await serviceClient
      .from("certificates")
      .update({ storage_path: ownerStoragePath })
      .eq("id", ownerCertificateId)
    expect(persistError).toBeNull()

    const { error: uploadOtherError } = await serviceClient.storage
      .from(CERTIFICATE_BUCKET)
      .upload(otherStoragePath, Buffer.from("%PDF-1.4\n%Other learner certificate\n%%EOF"), {
        contentType: "application/pdf",
        upsert: true,
      })
    expect(uploadOtherError).toBeNull()
    const { error: persistOtherError } = await serviceClient
      .from("certificates")
      .update({ storage_path: otherStoragePath })
      .eq("id", otherCertificateId)
    expect(persistOtherError).toBeNull()
  }, 45000)

  afterAll(async () => {
    try {
      await serviceClient.storage.from(CERTIFICATE_BUCKET).remove([ownerStoragePath, otherStoragePath])
    } catch {
      // cleanup best-effort
    }
    await serviceClient.from("certificates").delete().eq("id", ownerCertificateId)
    await serviceClient.from("certificates").delete().eq("id", otherCertificateId)
    await serviceClient.from("profiles").delete().in("id", [ownerUserId, otherUserId])
    await serviceClient.auth.admin.deleteUser(ownerUserId)
    await serviceClient.auth.admin.deleteUser(otherUserId)
  }, 45000)

  describe("Storage bucket privacy", () => {
    it("certificates bucket is private (not public)", async () => {
      const { data: buckets, error } = await serviceClient.storage.listBuckets()
      expect(error).toBeNull()
      const certBucket = buckets?.find((b) => b.id === CERTIFICATE_BUCKET)
      expect(certBucket).toBeDefined()
      expect(certBucket?.public).toBe(false)
    })

    it("getPublicUrl returns a URL string but bucket remains private", async () => {
      const { data: publicUrl } = serviceClient.storage.from(CERTIFICATE_BUCKET).getPublicUrl(ownerStoragePath)
      expect(publicUrl.publicUrl).toBeDefined()
      expect(publicUrl.publicUrl).toContain(ownerStoragePath)
    })
  })

  describe("Signed URL generation", () => {
    it("generates a signed URL for the owner's certificate", async () => {
      const { data: signed, error } = await serviceClient.storage
        .from(CERTIFICATE_BUCKET)
        .createSignedUrl(ownerStoragePath, 300)
      expect(error).toBeNull()
      expect(signed?.signedUrl).toBeDefined()
      expect(typeof signed?.signedUrl).toBe("string")
      expect(signed?.signedUrl).toContain(ownerStoragePath)
    })

    it("generates a short-lived signed URL", async () => {
      const { data: signed, error } = await serviceClient.storage
        .from(CERTIFICATE_BUCKET)
        .createSignedUrl(ownerStoragePath, 1)
      expect(error).toBeNull()
      expect(signed?.signedUrl).toBeDefined()
    })
  })

  describe("Learner download authorization (storage/DB level)", () => {
    it("owner certificate record points to owner storage", async () => {
      const { data: cert, error } = await serviceClient
        .from("certificates")
        .select("id, user_id, storage_path")
        .eq("id", ownerCertificateId)
        .maybeSingle()
      expect(error).toBeNull()
      expect(cert?.user_id).toBe(ownerUserId)
      expect(cert?.storage_path).toBe(ownerStoragePath)

      const { data: signed, error: signError } = await serviceClient.storage
        .from(CERTIFICATE_BUCKET)
        .createSignedUrl(cert?.storage_path ?? "", 300)
      expect(signError).toBeNull()
      expect(signed?.signedUrl).toBeDefined()
    })

    it("non-owner certificate record belongs to different user", async () => {
      const { data: otherCert, error } = await serviceClient
        .from("certificates")
        .select("id, user_id, storage_path")
        .eq("id", otherCertificateId)
        .maybeSingle()
      expect(error).toBeNull()
      expect(otherCert?.user_id).toBe(otherUserId)
      expect(otherCert?.user_id).not.toBe(ownerUserId)
    })

    it("missing certificate returns null gracefully", async () => {
      const { data: cert, error } = await serviceClient
        .from("certificates")
        .select("id, storage_path")
        .eq("id", "00000000-0000-0000-0000-000000000999")
        .maybeSingle()
      expect(error).toBeNull()
      expect(cert).toBeNull()
    })

    it("missing storage object fails safely", async () => {
      const { data: signed, error } = await serviceClient.storage
        .from(CERTIFICATE_BUCKET)
        .createSignedUrl("certificates/nonexistent/nonexistent.pdf", 300)
      expect(error).not.toBeNull()
      expect(signed).toBeNull()
    })
  })

  describe("Admin download access (storage/DB level)", () => {
    it("service-role can access certificate records and generate signed URLs", async () => {
      const { data: ownerCert } = await serviceClient
        .from("certificates")
        .select("id, storage_path")
        .eq("id", ownerCertificateId)
        .maybeSingle()
      expect(ownerCert?.storage_path).toBe(ownerStoragePath)

      const { data: otherCert } = await serviceClient
        .from("certificates")
        .select("id, storage_path")
        .eq("id", otherCertificateId)
        .maybeSingle()
      expect(otherCert?.storage_path).toBe(otherStoragePath)

      const { data: signed, error } = await serviceClient.storage
        .from(CERTIFICATE_BUCKET)
        .createSignedUrl(otherStoragePath, 300)
      expect(error).toBeNull()
      expect(signed?.signedUrl).toBeDefined()
    })
  })
})
