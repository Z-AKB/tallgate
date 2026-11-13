import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const { createPublicClient, isSupabaseConfigured, rpcMock, abortSignalMock } = vi.hoisted(() => {
  const rpcMock = vi.fn()
  const abortSignalMock = vi.fn((signal: AbortSignal) => rpcMock(signal))
  const createPublicClient = vi.fn(() => ({
    rpc: vi.fn(() => ({
      abortSignal: abortSignalMock,
    })),
  }))
  const isSupabaseConfigured = vi.fn(() => true)

  return {
    createPublicClient,
    isSupabaseConfigured,
    rpcMock,
    abortSignalMock,
  }
})

vi.mock("@/lib/supabase/server", () => ({
  createPublicClient,
  isSupabaseConfigured,
}))

import { GET } from "@/app/api/verify/route"

describe("Certificate Verification API (GET /api/verify)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupabaseConfigured.mockReturnValue(true)
    rpcMock.mockReset()
    abortSignalMock.mockReset()
  })

  it("rejects request when verification code is missing", async () => {
    const req = new NextRequest("https://tallgate.ng/api/verify")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Code is required")
  })

  it("rejects malformed verification codes", async () => {
    const invalidCodes = ["abc", "code with spaces", "TG!", "a".repeat(70)]
    for (const code of invalidCodes) {
      const req = new NextRequest(`https://tallgate.ng/api/verify?code=${encodeURIComponent(code)}`)
      const res = await GET(req)
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe("Invalid verification code format.")
    }
  })

  it("returns 404 NOT FOUND for unknown verification codes", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-UNKNOWN00000")
    const res = await GET(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.status).toBe("not_found")
    expect(json.error).toBe("Certificate not found.")
  })

  it("returns VALID and public fields only for an active certificate", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          certificate_number: "TG/DH/01021/21",
          course_title: "Professional Telehealth & Digital Health Training Programme",
          issue_date: "2026-10-15",
          is_valid: true,
        },
      ],
      error: null,
    })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-VALID0000001")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.status).toBe("valid")
    expect(json.certificate).toEqual({
      certificate_number: "TG/DH/01021/21",
      course_title: "Professional Telehealth & Digital Health Training Programme",
      issue_date: "2026-10-15",
      status: "valid",
    })

    // Verify sensitive/internal fields are never disclosed
    expect(json.certificate.recipient_name).toBeUndefined()
    expect(json.certificate.user_id).toBeUndefined()
    expect(json.certificate.storage_path).toBeUndefined()
    expect(json.certificate.verification_code).toBeUndefined()
  })

  it("returns REVOKED for a revoked certificate and never reports it as valid", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          certificate_number: "TG/DH/01021/21",
          course_title: "Professional Telehealth & Digital Health Training Programme",
          issue_date: "2026-10-15",
          is_valid: false,
        },
      ],
      error: null,
    })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-REVOKED0001")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(json.status).toBe("revoked")
    expect(json.certificate.status).toBe("revoked")
  })

  it("works without trusted proxy headers", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          certificate_number: "TG/DH/01021/21",
          course_title: "Professional Telehealth & Digital Health Training Programme",
          issue_date: "2026-10-15",
          is_valid: true,
        },
      ],
      error: null,
    })

    const req = new NextRequest("https://tallgateltd.com/api/verify?code=TG-2026-VALID0000001")
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })

  it("attaches a 10-second AbortSignal timeout to the RPC call", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-TEST0000001")
    const res = await GET(req)
    expect(res.status).toBe(404)

    expect(abortSignalMock).toHaveBeenCalledTimes(1)
    const signal = abortSignalMock.mock.calls[0][0]
    expect(signal).toBeDefined()
    expect(typeof signal.aborted).toBe("boolean")
    expect(typeof signal.addEventListener).toBe("function")
  })

  it("returns 503 when the RPC times out (AbortError)", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        message: "AbortError: The user aborted a request.",
        details: "",
        hint: "The request was aborted locally via the provided AbortSignal.",
        code: "",
      },
    })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-TIMEOUT001")
    const res = await GET(req)
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe("Certificate verification is temporarily unavailable.")
  })

  it("returns 503 when the verification RPC fails", async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error("Database connection failed") })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-DBFAIL00001")
    const res = await GET(req)
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe("Certificate verification is temporarily unavailable.")
  })

  it("returns 503 when Supabase is not configured", async () => {
    isSupabaseConfigured.mockReturnValue(false)

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-NOCONFIG001")
    const res = await GET(req)
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.error).toBe("Certificate verification is temporarily unavailable.")
  })

  it("rejects empty verification code", async () => {
    const req = new NextRequest("https://tallgate.ng/api/verify?code=")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe("Code is required")
  })

  it("does not call Supabase RPC for invalid code format", async () => {
    const req = new NextRequest("https://tallgate.ng/api/verify?code=invalid code!")
    const res = await GET(req)
    expect(res.status).toBe(400)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("releases concurrency slot after successful verification", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          certificate_number: "TG/DH/01021/21",
          course_title: "Professional Telehealth & Digital Health Training Programme",
          issue_date: "2026-10-15",
          is_valid: true,
        },
      ],
      error: null,
    })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-VALID0000001")
    const res = await GET(req)
    expect(res.status).toBe(200)

    // Slot should be released - subsequent request succeeds
    const req2 = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-UNKNOWN00000")
    rpcMock.mockResolvedValue({ data: [], error: null })
    const res2 = await GET(req2)
    expect(res2.status).toBe(404)
  })

  it("releases concurrency slot after RPC timeout", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: {
        message: "AbortError: The user aborted a request.",
        details: "",
        hint: "The request was aborted locally via the provided AbortSignal.",
        code: "",
      },
    })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-TIMEOUT001")
    const res = await GET(req)
    expect(res.status).toBe(503)

    // Slot should be released - subsequent request succeeds
    const req2 = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-UNKNOWN00000")
    rpcMock.mockResolvedValue({ data: [], error: null })
    const res2 = await GET(req2)
    expect(res2.status).toBe(404)
  })

  it("releases concurrency slot after unexpected RPC error", async () => {
    rpcMock.mockRejectedValue(new Error("Unexpected network failure"))

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-UNEXPECTED001")
    const res = await GET(req)
    expect(res.status).toBe(503)

    // Slot should be released - subsequent request succeeds
    const req2 = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-UNKNOWN00000")
    rpcMock.mockResolvedValue({ data: [], error: null })
    const res2 = await GET(req2)
    expect(res2.status).toBe(404)
  })

  it("returns no-store cache header on all responses", async () => {
    rpcMock.mockResolvedValue({ data: [], error: null })

    const req = new NextRequest("https://tallgate.ng/api/verify?code=TG-2026-UNKNOWN00000")
    const res = await GET(req)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })
})
