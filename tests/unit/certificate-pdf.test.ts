import { describe, expect, it } from "vitest"
import { renderCertificatePdf } from "@/lib/certificates/generateCertificatePdf"
import { resolveCertificateCourseDescription } from "@/lib/certificates/issueCertificate"

describe("renderCertificatePdf", () => {
  it("renders a real A4-landscape PDF for a synthetic fixture", async () => {
    const buffer = await renderCertificatePdf({
      recipient_name: "Fixture Recipient For Rendering Smoke Test",
      course_title: "Fixture Programme Title - Rendering Smoke Test",
      course_description: "This is a test course description for the fixture programme.",
      issue_date: "2026-03-09",
      grade: "Distinction",
      certificate_number: "TG/DH/01021/26",
      verification_code: "TG-TEST-000000000000",
      verification_url: "https://verify.example.invalid/verify?code=TG-TEST-000000000000",
      qr_data_url:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    const header = buffer.subarray(0, 5).toString("ascii")
    expect(header).toBe("%PDF-")
    expect(buffer.length).toBeGreaterThan(2000)
    expect(buffer.toString("latin1")).toContain("MediaBox")
  })

  it("safely fits very long recipient names and long course titles without errors", async () => {
    const buffer = await renderCertificatePdf({
      recipient_name: "Dr. Bartholomew Alexander Montgomery-Finch the Third",
      course_title:
        "Advanced Executive Postgraduate Diploma in Healthcare Information Systems, Telemedicine Technologies, and Health Data Governance",
      course_description: "A comprehensive programme covering healthcare information systems, telemedicine technologies, and health data governance for modern healthcare professionals.",
      issue_date: "2026-10-15",
      grade: null,
      certificate_number: "TG/DH/01099/26",
      verification_code: "TG-LONG-1234567890AB",
      verification_url: "https://verify.example.invalid/verify?code=TG-LONG-1234567890AB",
      qr_data_url:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-")
    expect(buffer.length).toBeGreaterThan(2000)
  })

  it("supports rendering with an optional logo data URL", async () => {
    const buffer = await renderCertificatePdf({
      recipient_name: "Jane Doe",
      course_title: "Professional Telehealth & Digital Health Training Programme",
      course_description: "Professional training in telehealth and digital health technologies.",
      issue_date: "2026-10-15",
      grade: "Distinction",
      certificate_number: "TG/DH/01021/21",
      verification_code: "TG-2026-DEMO0001",
      verification_url: "https://tallgate.ng/verify?code=TG-2026-DEMO0001",
      qr_data_url:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      logo_src:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-")
  })

  it("renders a valid PDF when course_description is an empty string (short_description → overview fallback upstream)", async () => {
    // The short_description || overview fallback lives in issueCertificate.ts.
    // By the time renderCertificatePdf is called, the resolved description is
    // passed in. This test confirms the renderer handles an empty string
    // gracefully (the upstream fallback ensures this path is reached only when
    // both short_description and overview are absent).
    const buffer = await renderCertificatePdf({
      recipient_name: "Grace Learner",
      course_title: "Advanced Bookkeeping",
      course_description: "",
      issue_date: "2026-10-12",
      grade: "Distinction",
      certificate_number: "TG/DH/01021/26",
      verification_code: "TG-2026-TESTCODE",
      verification_url: "https://tallgateltd.com/verify?code=TG-2026-TESTCODE",
      qr_data_url:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    })

    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-")
    expect(buffer.length).toBeGreaterThan(2000)
  })
})

describe("resolveCertificateCourseDescription", () => {
  it("prioritizes non-empty short_description over overview", () => {
    const description = resolveCertificateCourseDescription({
      short_description: "Focused course summary for certificate",
      overview: "Comprehensive curriculum overview",
    })
    expect(description).toBe("Focused course summary for certificate")
  })

  it("falls back to overview when short_description is null", () => {
    const description = resolveCertificateCourseDescription({
      short_description: null,
      overview: "Comprehensive curriculum overview",
    })
    expect(description).toBe("Comprehensive curriculum overview")
  })

  it("falls back to overview when short_description is an empty string", () => {
    const description = resolveCertificateCourseDescription({
      short_description: "",
      overview: "Comprehensive curriculum overview",
    })
    expect(description).toBe("Comprehensive curriculum overview")
  })

  it("returns empty string when both short_description and overview are null", () => {
    const description = resolveCertificateCourseDescription({
      short_description: null,
      overview: null,
    })
    expect(description).toBe("")
  })

  it("returns empty string when both short_description and overview are empty strings", () => {
    const description = resolveCertificateCourseDescription({
      short_description: "",
      overview: "",
    })
    expect(description).toBe("")
  })

  it("returns empty string when course object is null or undefined", () => {
    expect(resolveCertificateCourseDescription(null)).toBe("")
    expect(resolveCertificateCourseDescription(undefined)).toBe("")
  })
})