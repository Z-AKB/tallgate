import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  certificateEmailIdempotencyKey,
  safeHref,
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
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")
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

describe("sendCertificateEmail HTML escaping", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test_api_key")
    vi.stubEnv("RESEND_FROM_EMAIL", "certificates@tallgate.example.com")
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://tallgate.example.com")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("escapes HTML special characters in recipient name", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-1" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ recipientName: "Alice <script>alert(1)</script> & Bob" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain("Alice &lt;script&gt;alert(1)&lt;/script&gt; &amp; Bob")
    expect(body.html).not.toContain("<script>")
  })

  it("escapes HTML special characters in course title", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-2" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ courseTitle: 'Advanced <b>Bookkeeping</b> & "Finance"' })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain("Advanced &lt;b&gt;Bookkeeping&lt;/b&gt; &amp; &quot;Finance&quot;")
    expect(body.html).not.toContain("<b>")
  })

  it("escapes HTML special characters in certificate number", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-3" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ certificateNumber: 'TG/DH/00001/26" onmouseover="alert(1)' })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain("&quot; onmouseover=&quot;alert(1)")
    expect(body.html).not.toContain('" onmouseover="')
  })

  it("uses the original https URL as a safe href for a valid verification URL", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-4" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "https://tallgate.example.com/verify?code=TG-2026-ABCD" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="https://tallgate.example.com/verify?code=TG-2026-ABCD"')
  })

  it("replaces a javascript: URL scheme with # in href to prevent injection", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-5" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "javascript:alert(document.cookie)" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
    expect(body.html).not.toContain("javascript:")
  })

  it("replaces an http: (non-https) URL with # in href", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-6" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "http://tallgate.example.com/verify?code=abc" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
    expect(body.html).not.toContain('href="http://')
  })

  it("replaces an arbitrary external HTTPS origin with # in href", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-7" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "https://attacker.example.org/verify?code=TG-2026-ABCD" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
    expect(body.html).not.toContain("attacker.example.org")
  })

  it("replaces a domain suffix bypass attempt with # in href", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-8" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "https://tallgate.example.com.attacker.com/verify?code=abc" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
    expect(body.html).not.toContain("attacker.com")
  })

  it("replaces URL with # when NEXT_PUBLIC_SITE_URL is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-9" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "https://tallgate.example.com/verify?code=abc" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
  })

  it("replaces URL with # when NEXT_PUBLIC_SITE_URL is insecure http", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://tallgate.example.com")
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-10" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "https://tallgate.example.com/verify?code=abc" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
  })

  it("replaces a malformed URL with # in href", async () => {
    const fetchMock = createFetchMock({ ok: true, body: { id: "email-esc-11" } })
    vi.stubGlobal("fetch", fetchMock)

    await sendCertificateEmail(
      certificateEmailInput({ verificationUrl: "not-a-url-at-all" })
    )

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.html).toContain('href="#"')
  })
})

describe("safeHref unit tests", () => {
  it("accepts an exact origin match with HTTPS", () => {
    expect(
      safeHref("https://tallgateltd.com/verify?code=ABC-123", "https://tallgateltd.com")
    ).toBe("https://tallgateltd.com/verify?code=ABC-123")
  })

  it("escapes special HTML characters in the URL for attribute context", () => {
    expect(
      safeHref("https://tallgateltd.com/verify?code=ABC&user=1", "https://tallgateltd.com")
    ).toBe("https://tallgateltd.com/verify?code=ABC&amp;user=1")
  })

  it("rejects an external HTTPS host", () => {
    expect(
      safeHref("https://phishing.example.com/verify", "https://tallgateltd.com")
    ).toBe("#")
  })

  it("rejects non-HTTPS protocol even on matching host", () => {
    expect(
      safeHref("http://tallgateltd.com/verify", "https://tallgateltd.com")
    ).toBe("#")
  })

  it("rejects javascript: and data: schemes", () => {
    expect(safeHref("javascript:alert(1)", "https://tallgateltd.com")).toBe("#")
    expect(safeHref("data:text/html,test", "https://tallgateltd.com")).toBe("#")
  })

  it("rejects different port even on matching hostname", () => {
    expect(
      safeHref("https://tallgateltd.com:8443/verify", "https://tallgateltd.com")
    ).toBe("#")
  })

  it("returns # when configured site URL is invalid or missing", () => {
    expect(safeHref("https://tallgateltd.com/verify", "")).toBe("#")
    expect(safeHref("https://tallgateltd.com/verify", "http://tallgateltd.com")).toBe("#")
    expect(safeHref("https://tallgateltd.com/verify", "not-a-valid-url")).toBe("#")
  })
})
