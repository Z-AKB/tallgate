import { describe, expect, it } from "vitest"
import { formatCertificateIssueDate } from "@/lib/certificates/date"

describe("formatCertificateIssueDate", () => {
  it("formats an ISO calendar date numerically by default", () => {
    expect(formatCertificateIssueDate("2026-03-09")).toBe("3/9/2026")
  })

  it("formats a long, human-readable date when asked", () => {
    expect(formatCertificateIssueDate("2026-03-09", "long")).toBe("9 March 2026")
  })

  it("accepts a valid leap day", () => {
    expect(formatCertificateIssueDate("2024-02-29")).toBe("2/29/2024")
  })

  it("returns the input unchanged for a non-leap-year Feb 29", () => {
    expect(formatCertificateIssueDate("2023-02-29")).toBe("2023-02-29")
  })

  it("returns the input unchanged for impossible or malformed dates", () => {
    expect(formatCertificateIssueDate("2026-02-30")).toBe("2026-02-30")
    expect(formatCertificateIssueDate("not-a-date")).toBe("not-a-date")
    expect(formatCertificateIssueDate("")).toBe("")
  })
})