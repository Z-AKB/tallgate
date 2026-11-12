import { randomUUID } from "node:crypto"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import {
  sendCertificateEmail,
  certificateEmailIdempotencyKey,
  type CertificateEmailInput,
} from "@/lib/certificates/sendCertificateEmail"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing Supabase credentials in test environment: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

function createServiceClient() {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type DbClient = ReturnType<typeof createServiceClient>

describe("Phase 5: Resend email boundary validation (mocked fetch, disposable fixtures)", () => {
  let serviceClient: DbClient
  let testUserId: string
  let testUserEmail: string
  let baseInput: CertificateEmailInput

  beforeAll(async () => {
    serviceClient = createServiceClient()
    testUserEmail = `resend-boundary-${randomUUID()}@example.com`

    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: testUserEmail,
      password: "test-password-123",
      email_confirm: true,
    })
    expect(authError).toBeNull()
    if (!authData.user?.id) throw new Error("auth user creation returned no user")
    testUserId = authData.user.id

    const { error: profileError } = await serviceClient.from("profiles").upsert({
      id: testUserId,
      full_name: "Boundary Test User",
      email: testUserEmail,
    })
    expect(profileError).toBeNull()

    baseInput = {
      to: testUserEmail,
      recipientName: "Boundary Test User",
      courseTitle: "Boundary Test Course",
      certificateNumber: "TG-BOUNDARY-001",
      verificationUrl: "https://tallgate.example.com/verify?code=TG-BOUNDARY-001",
      pdfBuffer: Buffer.from("%PDF-1.4 boundary test certificate"),
      idempotencyKey: certificateEmailIdempotencyKey(`cert-boundary-${randomUUID()}`),
    }
  }, 30000)

  afterAll(async () => {
    await serviceClient.from("profiles").delete().eq("id", testUserId)
    await serviceClient.auth.admin.deleteUser(testUserId)
  }, 30000)

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe("HTTP boundary with mocked fetch", () => {
    it("sends correct recipient, sender, and PDF attachment", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-1" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await sendCertificateEmail(baseInput)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const call = fetchMock.mock.calls[0]
      const [url, init] = call as [string, RequestInit]
      expect(url).toBe("https://api.resend.com/emails")
      expect(init.method).toBe("POST")
      expect(typeof init.body).toBe("string")
      const body = JSON.parse(String(init.body)) as {
        from: string
        to: string[]
        attachments: Array<{ filename: string; content: string }>
      }
      expect(body.from).toBe("certificates@tallgate.example.com")
      expect(body.to).toEqual([testUserEmail])
      expect(body.attachments).toHaveLength(1)
      expect(body.attachments[0].filename).toBe("certificate-TG-BOUNDARY-001.pdf")
      expect(body.attachments[0].content).toBe(baseInput.pdfBuffer.toString("base64"))
    })

    it("uses stable idempotency key per certificate", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-5" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      const key1 = certificateEmailIdempotencyKey("cert-boundary-001")
      const key2 = certificateEmailIdempotencyKey("cert-boundary-001")
      expect(key1).toBe(key2)

      await sendCertificateEmail({ ...baseInput, idempotencyKey: key1 })
      await sendCertificateEmail({ ...baseInput, idempotencyKey: key2 })

      expect(fetchMock).toHaveBeenCalledTimes(2)
      const body1 = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)) as {
        attachments: Array<{ content: string }>
      }
      const body2 = JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body)) as {
        attachments: Array<{ content: string }>
      }
      expect(body1.attachments[0].content).toBe(body2.attachments[0].content)
    })

    it("rejects javascript: verification URLs", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-3" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await sendCertificateEmail({ ...baseInput, verificationUrl: "javascript:alert(document.cookie)" })

      const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)) as { html: string }
      expect(body.html).toContain('href="#"')
      expect(body.html).not.toContain("javascript:")
    })

    it("rejects http: (non-https) verification URLs", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-4" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await sendCertificateEmail({ ...baseInput, verificationUrl: "http://tallgate.example.com/verify?code=abc" })

      const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)) as { html: string }
      expect(body.html).toContain('href="#"')
      expect(body.html).not.toContain('href="http://')
    })

    it("rejects external HTTPS origins", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-5" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await sendCertificateEmail({ ...baseInput, verificationUrl: "https://attacker.example.org/verify?code=xyz" })

      const body = JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)) as { html: string }
      expect(body.html).toContain('href="#"')
      expect(body.html).not.toContain("attacker.example.org")
    })

    it("throws when Resend credentials are not configured", async () => {
      vi.stubEnv("RESEND_API_KEY", "")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-6" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await expect(sendCertificateEmail(baseInput)).rejects.toThrow("Email sending is not configured")
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("handles provider error responses (422)", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: "Invalid from address" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await expect(sendCertificateEmail(baseInput)).rejects.toThrow(
        "Failed to send certificate email: Invalid from address"
      )
    })

    it("passes AbortSignal.timeout to fetch for provider timeout protection", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test_key")
      vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: "email-7" }),
      })
      vi.stubGlobal("fetch", fetchMock)

      await sendCertificateEmail(baseInput)

      const init = (fetchMock.mock.calls[0] as [string, RequestInit])[1]
      expect(init.signal).toBeDefined()
      expect(init.signal?.aborted).toBe(false)
    })
  })
})
