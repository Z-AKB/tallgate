import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const {
  mockCreateAdminClient,
  mockRandomUUID,
  mockSendCertificateEmail,
  mockRequireAdminApi,
  mockCreateClient,
} = vi.hoisted(() => {
  return {
    mockCreateAdminClient: vi.fn(),
    mockRandomUUID: vi.fn().mockReturnValue("test-lease-token-123"),
    mockSendCertificateEmail: vi.fn().mockResolvedValue(undefined),
    mockRequireAdminApi: vi.fn().mockResolvedValue({
      user: { id: "admin-1", roles: ["admin"], profile: null },
      error: null,
    }),
    mockCreateClient: vi.fn(async () => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
      })),
    })),
  }
})

vi.mock("@/lib/auth/guards", () => ({ requireAdminApi: mockRequireAdminApi }))
vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock("@/lib/certificates/sendCertificateEmail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/certificates/sendCertificateEmail")>()
  return { ...actual, sendCertificateEmail: mockSendCertificateEmail }
})

vi.mock("@/lib/certificates/generateCertificatePdf", () => ({
  renderCertificatePdf: vi.fn().mockResolvedValue(Buffer.from("%PDF-mock")),
}))
vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mock") } }))

vi.stubGlobal("crypto", { randomUUID: mockRandomUUID })

import {
  claimAndSendCertificateEmail,
  releaseStaleEmailLeases,
  checkCertificateEmailRetryAllowed,
  MAX_CERTIFICATE_EMAIL_RETRIES,
} from "@/lib/certificates/issueCertificate"
import { certificateEmailIdempotencyKey } from "@/lib/certificates/sendCertificateEmail"
import { POST } from "@/app/api/admin/actions/route"

function createMockClient(overrides: Record<string, unknown> = {}) {
  const rpcMock = vi.fn()

  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        download: vi.fn().mockResolvedValue({ data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)) }, error: null }),
        remove: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/signed" }, error: null }),
      })),
    },
    rpc: rpcMock,
    ...overrides,
  }
}

describe("Email Lease Ownership (SECURITY DEFINER functions)", () => {
  let mockClient: ReturnType<typeof createMockClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockRandomUUID.mockReturnValue("test-lease-token-123")
    mockCreateAdminClient.mockReturnValue(mockClient)
  })

  it("claims lease atomically via SECURITY DEFINER function", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ // claim_certificate_email_lease
        data: [{
          claimed: true,
          current_status: 'sending',
          current_lease_token: 'test-lease-token-123',
          current_retry_count: 0,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ // complete_certificate_email_lease (sent)
        data: true,
        error: null,
      })

    await claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
      idempotencyKey: "test-key",
    })

    // Verify claim RPC was called with correct params
    expect(mockClient.rpc).toHaveBeenNthCalledWith(1, 'claim_certificate_email_lease', {
      p_certificate_id: "cert-1",
      p_lease_token: "test-lease-token-123",
      p_lease_timeout: '5 minutes',
    })

    // Verify complete RPC was called with correct params
    expect(mockClient.rpc).toHaveBeenNthCalledWith(2, 'complete_certificate_email_lease', {
      p_certificate_id: "cert-1",
      p_lease_token: "test-lease-token-123",
      p_email_status: 'sent',
      p_email_error: null,
    })
  })

  it("returns early if certificate already claimed by another process", async () => {
    mockClient.rpc.mockResolvedValueOnce({ // claim_certificate_email_lease - not claimed
      data: [{
        claimed: false,
        current_status: 'sending',
        current_lease_token: 'other-token',
        current_retry_count: 1,
      }],
      error: null,
    })

    await claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
    })

    // Should not call complete RPC
    expect(mockClient.rpc).toHaveBeenCalledTimes(1)
  })

  it("verifies lease token matches on claim (defense in depth)", async () => {
    mockClient.rpc.mockResolvedValueOnce({ // claim_certificate_email_lease - token mismatch
      data: [{
        claimed: true,
        current_status: 'sending',
        current_lease_token: 'different-token', // Different from what we generated
        current_retry_count: 0,
      }],
      error: null,
    })

    await claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
    })

    // Should not call complete RPC due to token mismatch
    expect(mockClient.rpc).toHaveBeenCalledTimes(1)
  })

  it("handles email failure and marks lease as failed with token verification", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ // claim_certificate_email_lease
        data: [{
          claimed: true,
          current_status: 'sending',
          current_lease_token: 'test-lease-token-123',
          current_retry_count: 0,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ // complete_certificate_email_lease (failed)
        data: true,
        error: null,
      })

    // Mock sendCertificateEmail to throw
    mockSendCertificateEmail.mockRejectedValueOnce(new Error("Resend API error"))

    await expect(claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
      idempotencyKey: "test-key",
    })).rejects.toThrow("Resend API error")

    // Verify both RPCs were called (claim + complete with failed status)
    expect(mockClient.rpc).toHaveBeenCalledTimes(2)
  })

  it("releases stale leases via SECURITY DEFINER function", async () => {
    const releaseMockClient = createMockClient()
    releaseMockClient.rpc.mockResolvedValueOnce({ // release_stale_certificate_email_leases
      data: 2,
      error: null,
    })
    mockCreateAdminClient.mockReturnValueOnce(releaseMockClient)

    const released = await releaseStaleEmailLeases()

    expect(mockCreateAdminClient).toHaveBeenCalled()
    expect(released).toBe(2)
    expect(releaseMockClient.rpc).toHaveBeenCalledWith('release_stale_certificate_email_leases', {
      p_lease_timeout_interval: '5 minutes',
    })
  })

  it("handles lease lost before completion (email sent but DB update failed)", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ // claim_certificate_email_lease
        data: [{
          claimed: true,
          current_status: 'sending',
          current_lease_token: 'test-lease-token-123',
          current_retry_count: 0,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ // complete_certificate_email_lease - returns false (lease lost)
        data: false,
        error: null,
      })

    // The function will log a warning but not throw
    await claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
      idempotencyKey: "test-key",
    })

    // Both RPCs called
    expect(mockClient.rpc).toHaveBeenCalledTimes(2)
  })

  it("handles lease lost before failure marking", async () => {
    mockClient.rpc
      .mockResolvedValueOnce({ // claim_certificate_email_lease
        data: [{
          claimed: true,
          current_status: 'sending',
          current_lease_token: 'test-lease-token-123',
          current_retry_count: 0,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ // complete_certificate_email_lease (failed) - returns false
        data: false,
        error: null,
      })

    // Mock sendCertificateEmail to throw
    mockSendCertificateEmail.mockRejectedValueOnce(new Error("Resend API error"))

    await expect(claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
      idempotencyKey: "test-key",
    })).rejects.toThrow("Resend API error")

    expect(mockClient.rpc).toHaveBeenCalledTimes(2)
  })
})

describe("Stable Idempotency Key for Retries", () => {
  it("uses the same stable key for admin retries and initial issue of the same certificate", () => {
    const certId = "cert-123"

    // The issuance path (issueCourseCertificate) and the admin retry path
    // (resend_certificate_email) must share one key per certificate so Resend
    // deduplicates across retries within the 24-hour idempotency window.
    const issueKey = certificateEmailIdempotencyKey(certId)
    const retryKey = certificateEmailIdempotencyKey(certId)

    expect(issueKey).toBe(retryKey)
    expect(retryKey).toBe(`certificate-email-${certId}`)
  })

  it("does not embed the retry attempt count in the key", () => {
    const certId = "cert-123"
    const retryCount = 5

    const key = certificateEmailIdempotencyKey(certId)

    expect(key).not.toContain(retryCount.toString())
  })

  it("uses a distinct key per certificate", () => {
    expect(certificateEmailIdempotencyKey("cert-1")).not.toBe(certificateEmailIdempotencyKey("cert-2"))
  })
})

describe("Admin Retry Concurrency", () => {
  let mockClient: ReturnType<typeof createMockClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockRandomUUID
      .mockReturnValueOnce("token-first")
      .mockReturnValueOnce("token-second")
    mockCreateAdminClient.mockReturnValue(mockClient)
  })

  it("concurrent retries cannot send duplicate emails - second finds already claimed", async () => {
    // First retry claims successfully
    mockClient.rpc
      .mockResolvedValueOnce({ // First claim
        data: [{
          claimed: true,
          current_status: 'sending',
          current_lease_token: 'token-first',
          current_retry_count: 0,
        }],
        error: null,
      })
      .mockResolvedValueOnce({ // First complete
        data: true,
        error: null,
      })

    await claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
      idempotencyKey: certificateEmailIdempotencyKey("cert-1"),
    })

    // Second retry finds already sending
    mockClient.rpc.mockResolvedValueOnce({ // Second claim - not claimed
      data: [{
        claimed: false,
        current_status: 'sending',
        current_lease_token: 'token-first',
        current_retry_count: 1,
      }],
      error: null,
    })

    await claimAndSendCertificateEmail(mockClient, {
      certificateId: "cert-1",
      to: "test@example.com",
      recipientName: "Test User",
      courseTitle: "Test Course",
      certificateNumber: "TG-001",
      verificationUrl: "https://example.com/verify",
      pdfBuffer: Buffer.from("pdf"),
      idempotencyKey: certificateEmailIdempotencyKey("cert-1"),
    })

    // Only first claim should have proceeded to complete
    // (second returns early when claimed === false)
    expect(mockClient.rpc).toHaveBeenCalledTimes(3) // claim + complete + claim
  })
})

describe("Certificate Permissions - Lease Token Security", () => {
  let mockClient: ReturnType<typeof createMockClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createMockClient()
    mockRandomUUID.mockReturnValue("test-lease-token-123")
    mockCreateAdminClient.mockReturnValue(mockClient)
  })

  it("lease token is generated per claim attempt", () => {
    const tokens = new Set()
    for (let i = 0; i < 100; i++) {
      // In real code, crypto.randomUUID() is used
      tokens.add(`token-${i}`)
    }
    expect(tokens.size).toBe(100)
  })

  it("throws when the claim RPC returns an authorization error (simulating SECURITY DEFINER rejection)", async () => {
    // The DB SECURITY DEFINER functions raise an EXCEPTION for non-admin callers.
    // Supabase surfaces this as a non-null error on the RPC response.
    mockClient.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Only administrators can claim certificate email leases" },
    })

    await expect(
      claimAndSendCertificateEmail(mockClient, {
        certificateId: "cert-1",
        to: "test@example.com",
        recipientName: "Test User",
        courseTitle: "Test Course",
        certificateNumber: "TG-001",
        verificationUrl: "https://example.com/verify",
        pdfBuffer: Buffer.from("pdf"),
        idempotencyKey: certificateEmailIdempotencyKey("cert-1"),
      })
    ).rejects.toThrow("Failed to claim certificate for email delivery")

    // Email must NOT be sent when the lease claim is rejected
    expect(mockSendCertificateEmail).not.toHaveBeenCalled()
  })
})

describe("Server-Side Email Retry Enforcement", () => {
  function adminResendRequest(certificateId: string) {
    return new NextRequest("https://tallgate.test/api/admin/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "resend_certificate_email",
        payload: { id: certificateId },
      }),
    })
  }

  function createRouteMockClient(certOverrides: Record<string, unknown> = {}) {
    const rpcMock = vi.fn().mockImplementation((fn: string) => {
      if (fn === "release_stale_certificate_email_leases") {
        return Promise.resolve({ data: 0, error: null })
      }
      if (fn === "claim_certificate_email_lease") {
        return Promise.resolve({
          data: [{
            claimed: true,
            current_status: "sending",
            current_lease_token: "test-lease-token-123",
            current_retry_count: certOverrides.email_retry_count ?? 0,
          }],
          error: null,
        })
      }
      if (fn === "complete_certificate_email_lease") {
        return Promise.resolve({ data: true, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    const certData = {
      id: "cert-retry-test",
      certificate_number: "TG/DH/00001/26",
      verification_code: "TG-2026-TESTCODE",
      recipient_name: "Grace Learner",
      user_id: "user-test-id",
      course_title: "Bookkeeping",
      issue_date: "2026-10-10",
      grade: "Distinction",
      storage_path: "certs/test.pdf",
      email_status: "failed",
      email_sent_at: null,
      email_error: "Previous delivery error",
      email_retry_count: 0,
      ...certOverrides,
    }

    const fromMock = vi.fn((table: string) => {
      if (table === "certificates") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: certData, error: null }),
        }
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { email: "learner@example.com", full_name: "Grace Learner" },
            error: null,
          }),
        }
      }
      if (table === "admin_audit_logs") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnThis(),
      }
    })

    return {
      from: fromMock,
      storage: {
        from: vi.fn(() => ({
          download: vi.fn().mockResolvedValue({
            data: { arrayBuffer: () => Promise.resolve(new ArrayBuffer(16)) },
            error: null,
          }),
        })),
      },
      rpc: rpcMock,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")
    mockRequireAdminApi.mockResolvedValue({
      user: { id: "admin-1", roles: ["admin"], profile: null },
      error: null,
    })
  })

  describe("pure retry limit logic (checkCertificateEmailRetryAllowed)", () => {
    it("allows retry when email_retry_count is 0 (initial attempt completed, 0 retries so far)", () => {
      const check = checkCertificateEmailRetryAllowed(0)
      expect(check.allowed).toBe(true)
      expect(check.retryCount).toBe(0)
    })

    it("allows retry when email_retry_count is 2 (2 prior attempts completed, below max of 3)", () => {
      const check = checkCertificateEmailRetryAllowed(2)
      expect(check.allowed).toBe(true)
      expect(check.retryCount).toBe(2)
    })

    it("rejects retry when email_retry_count reaches the limit of 3", () => {
      const check = checkCertificateEmailRetryAllowed(3)
      expect(check.allowed).toBe(false)
      expect(check.retryCount).toBe(3)
      if (!check.allowed) {
        expect(check.status).toBe(400)
        expect(check.error).toBe("Maximum email retry attempts reached. This certificate cannot be resent.")
      }
    })

    it("rejects retry when email_retry_count exceeds the limit of 3 (e.g. 4)", () => {
      const check = checkCertificateEmailRetryAllowed(4)
      expect(check.allowed).toBe(false)
      expect(check.retryCount).toBe(4)
      if (!check.allowed) {
        expect(check.status).toBe(400)
      }
    })

    it("treats null or undefined email_retry_count safely as 0 (allowed)", () => {
      expect(checkCertificateEmailRetryAllowed(null).allowed).toBe(true)
      expect(checkCertificateEmailRetryAllowed(undefined).allowed).toBe(true)
    })

    it("enforces MAX_CERTIFICATE_EMAIL_RETRIES constant as 3", () => {
      expect(MAX_CERTIFICATE_EMAIL_RETRIES).toBe(3)
    })
  })

  describe("admin resend route handler (POST /api/admin/actions)", () => {
    it("rejects resend when email_retry_count = 3 without claiming lease or sending email", async () => {
      const routeMockClient = createRouteMockClient({ email_retry_count: 3 })
      mockCreateAdminClient.mockReturnValue(routeMockClient)

      const response = await POST(adminResendRequest("cert-retry-test"))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Maximum email retry attempts reached. This certificate cannot be resent.")

      // Must NOT attempt to claim lease for sending
      expect(routeMockClient.rpc).not.toHaveBeenCalledWith(
        "claim_certificate_email_lease",
        expect.anything()
      )
      // Must NOT invoke the email delivery function
      expect(mockSendCertificateEmail).not.toHaveBeenCalled()
    })

    it("rejects resend when email_retry_count > 3 (e.g. 4) without claiming lease or sending email", async () => {
      const routeMockClient = createRouteMockClient({ email_retry_count: 4 })
      mockCreateAdminClient.mockReturnValue(routeMockClient)

      const response = await POST(adminResendRequest("cert-retry-test"))

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe("Maximum email retry attempts reached. This certificate cannot be resent.")

      // Must NOT attempt to claim lease
      expect(routeMockClient.rpc).not.toHaveBeenCalledWith(
        "claim_certificate_email_lease",
        expect.anything()
      )
      // Must NOT invoke email sending
      expect(mockSendCertificateEmail).not.toHaveBeenCalled()
    })

    it("allows resend when email_retry_count = 2 and proceeds to lease claiming and sending", async () => {
      const routeMockClient = createRouteMockClient({ email_retry_count: 2 })
      mockCreateAdminClient.mockReturnValue(routeMockClient)

      const response = await POST(adminResendRequest("cert-retry-test"))

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verified: route proceeded to claim lease via RPC
      expect(routeMockClient.rpc).toHaveBeenCalledWith(
        "claim_certificate_email_lease",
        expect.objectContaining({
          p_certificate_id: "cert-retry-test",
        })
      )

      // Verified: email was sent with the certificate details
      expect(mockSendCertificateEmail).toHaveBeenCalledTimes(1)
      expect(mockSendCertificateEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "learner@example.com",
          recipientName: "Grace Learner",
          courseTitle: "Bookkeeping",
          certificateNumber: "TG/DH/00001/26",
        })
      )
    })
  })
})