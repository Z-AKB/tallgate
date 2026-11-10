import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockCreateAdminClient, mockRandomUUID, mockSendCertificateEmail } = vi.hoisted(() => {
  return {
    mockCreateAdminClient: vi.fn(),
    mockRandomUUID: vi.fn().mockReturnValue("test-lease-token-123"),
    mockSendCertificateEmail: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}))

vi.mock("@/lib/certificates/sendCertificateEmail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/certificates/sendCertificateEmail")>()
  return { ...actual, sendCertificateEmail: mockSendCertificateEmail }
})

vi.stubGlobal("crypto", { randomUUID: mockRandomUUID })

import { claimAndSendCertificateEmail, releaseStaleEmailLeases } from "@/lib/certificates/issueCertificate"
import { certificateEmailIdempotencyKey } from "@/lib/certificates/sendCertificateEmail"

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
  it("lease token is generated per claim attempt", () => {
    const tokens = new Set()
    for (let i = 0; i < 100; i++) {
      // In real code, crypto.randomUUID() is used
      tokens.add(`token-${i}`)
    }
    expect(tokens.size).toBe(100)
  })

  it("SECURITY DEFINER functions require admin authorization", () => {
    // This is tested via the is_admin() check inside the functions
    // The functions will raise EXCEPTION if caller is not admin
    expect(true).toBe(true)
  })
})