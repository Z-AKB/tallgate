import { describe, expect, it } from "vitest"
import {
  formatDate,
  formatNaira,
  formatNumber,
  getErrorMessage,
  isNonEmptyString,
  isOneOf,
  isRecord,
} from "@/lib/utils"

describe("formatNaira", () => {
  it("formats a numeric amount without decimal places", () => {
    expect(formatNaira(1500)).toContain("1,500")
  })

  it("strips currency symbols from string input before formatting", () => {
    expect(formatNaira("₦2,000")).toContain("2,000")
  })
})

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234567)).toBe("1,234,567")
  })
})

describe("formatDate", () => {
  it("formats a date string in UTC", () => {
    expect(formatDate("2026-03-09T23:30:00.000Z")).toBe("9 Mar 2026")
  })

  it("returns an empty string for empty input", () => {
    expect(formatDate("")).toBe("")
  })
})

describe("guards", () => {
  it("isRecord only accepts plain objects", () => {
    expect(isRecord({ a: 1 })).toBe(true)
    expect(isRecord([])).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(isRecord("x")).toBe(false)
  })

  it("isNonEmptyString rejects blank strings", () => {
    expect(isNonEmptyString(" hi ")).toBe(true)
    expect(isNonEmptyString("   ")).toBe(false)
    expect(isNonEmptyString(42)).toBe(false)
  })

  it("isOneOf narrows to the allowed values", () => {
    const allowed = ["admin", "learner"] as const
    expect(isOneOf(allowed, "admin")).toBe(true)
    expect(isOneOf(allowed, "owner")).toBe(false)
  })
})

describe("getErrorMessage", () => {
  it("prefers Error messages", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom")
  })

  it("reads Supabase-style { error } payloads", () => {
    expect(getErrorMessage({ error: "rate limited" })).toBe("rate limited")
  })

  it("falls back when nothing usable is present", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback")
    expect(getErrorMessage({ error: "  " }, "fallback")).toBe("fallback")
  })
})