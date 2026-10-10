import { describe, expect, it } from "vitest"
import {
  buildObjectPath,
  sanitizeObjectSegment,
} from "@/lib/admin/courseContentPaths"

const INVALID_KEY_CHARS = /[^A-Za-z0-9._/-]/

describe("sanitizeObjectSegment", () => {
  it("replaces spaces and en dashes with underscores", () => {
    expect(
      sanitizeObjectSegment("Module 7 – Healthcare Data Privacy & Security.pptx")
    ).toBe("Module_7_Healthcare_Data_Privacy_Security.pptx")
  })

  it("strips diacritics instead of dropping the letters", () => {
    expect(sanitizeObjectSegment("Café Résumé.PDF")).toBe("Cafe_Resume.PDF")
  })

  it("collapses runs of unsafe characters into a single underscore", () => {
    expect(sanitizeObjectSegment("A   B")).toBe("A_B")
  })

  it("produces only storage-safe characters for non-ASCII input", () => {
    const result = sanitizeObjectSegment("填报指南.pdf")
    expect(result).not.toMatch(INVALID_KEY_CHARS)
  })
})

describe("buildObjectPath", () => {
  it("sanitizes the file name so non-ASCII module titles can be uploaded", () => {
    expect(
      buildObjectPath(
        "course-1",
        "lesson-2",
        "Telehealth/WK_6/Module 7 – Healthcare Data Privacy & Security.pptx"
      )
    ).toMatch(
      /^course-1\/lesson-2\/[0-9a-f-]{36}\/Telehealth\/WK_6\/Module_7_Healthcare_Data_Privacy_Security\.pptx$/
    )
  })

  it("never emits characters that Supabase Storage rejects", () => {
    const path = buildObjectPath(
      "course-1",
      "lesson-2",
      "Telehealth/WK 1/Module 1 – Introduction to Telehealth.pptx"
    )
    expect(path).not.toMatch(INVALID_KEY_CHARS)
    expect(path).not.toContain("//")
  })

  it("keeps the extension when truncating long file names", () => {
    const path = buildObjectPath("c", "l", `${"a".repeat(200)}.pptx`)
    const leaf = path.split("/").at(-1) as string
    expect(leaf.length).toBeLessThanOrEqual(100)
    expect(leaf.endsWith(".pptx")).toBe(true)
  })

  it("falls back to a material name when the path has no usable segments", () => {
    const path = buildObjectPath("c", "l", "  ")
    expect(path.split("/").at(-1)).toBe("material")
  })
})
