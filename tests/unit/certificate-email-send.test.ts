import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  certificateEmailIdempotencyKey,
  sendCertificateEmail,
  type CertificateEmailInput,
} from "@/lib/certificates/sendCertificateEmail"

function createFetchMock(response: { ok: boolean; status?: number; body: Record<string, unknown> }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: async () => response.body,
  })
}

function certificateEmailInput(overrides: Partial<CertificateEmailInput> = {}): CertificateEmailInput {
  return {
    to: "learner@example.com",
    recipientName: "Grace Learner",
    courseTitle: "Advanced Bookkeeping",
    certificateNumber: "TG-2026-0001",
    verificationUrl: "https://tallgate.example.com/verify?code=abc123",
    pdfBuffer: Buffer.from("%PDF-1.4 fake certificate"),
    idempotencyKey: certificateEmailIdempotencyKey("cert-42"),
    ...overrides,
  }
}

describe("sendCertificateEmail (Resend integration)", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_api_key")
    vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("sends the certificate via Resend with the stable per-certificate idempotency key", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-1" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(certificateEmailInput())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({
      Authorization: "Bearer re_test_api_key",
      "Content-Type": "application/json",
      "Idempotency-Key": certificateEmailIdempotencyKey("cert-42"),
    })

    const body = JSON.parse(init.body)
    expect(body.from).toBe("certificates@tallgate.example.com")
    expect(body.to).toEqual(["learner@example.com"])
    expect(body.subject).toContain("Advanced Bookkeeping")
    expect(body.attachments).toHaveLength(1)
    expect(body.attachments[0].filename).toBe("certificate-TG-2026-0001.pdf")
    expect(body.attachments[0].content).toBe(Buffer.from("%PDF-1.4 fake certificate").toString("base64"))
  })

  it("omits the Idempotency-Key header when no key is provided", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-2" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(certificateEmailInput({ idempotencyKey: undefined }))

    const init = fetchMock.mock.calls[0][1]
    expect(init.headers).not.toHaveProperty("Idempotency-Key")
  })

  it("throws before calling Resend when email sending is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "")
    const fetchMock = createFetchMock({ ok: true, body: {} })
    vi.stubGlobal("fetch", fetchMock)

    await expect(sendCertificateEmail(certificateEmailInput())).rejects.toThrow(
      "Email sending is not configured"
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("surfaces the Resend error message when the request is rejected", async () => {
    const fetchMock = createFetchMock({ ok: false, status: 422, body: { message: "Invalid from address" } })
    vi.stubGlobal("fetch", fetchMock)
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    try {
      await expect(sendCertificateEmail(certificateEmailInput())).rejects.toThrow(
        "Failed to send certificate email: Invalid from address"
      )
      expect(consoleError).toHaveBeenCalledTimes(1)
    } finally {
      consoleError.mockRestore()
    }
  })
})
