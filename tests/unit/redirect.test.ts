import { describe, expect, it } from "vitest"
import { getPostLoginPath, safeNextPath } from "@/lib/auth/redirect"

describe("safeNextPath", () => {
  it("accepts same-origin absolute paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard")
    expect(safeNextPath("/admin")).toBe("/admin")
  })

  it("preserves query and hash on allowed paths", () => {
    expect(safeNextPath("/dashboard?tab=1#section")).toBe("/dashboard?tab=1#section")
  })

  it("rejects protocol-relative and absolute external URLs", () => {
    expect(safeNextPath("//evil.com")).toBeNull()
    expect(safeNextPath("https://evil.com")).toBeNull()
    expect(safeNextPath("http://evil.com/path")).toBeNull()
  })

  it("rejects non-path schemes", () => {
    expect(safeNextPath("javascript:alert(1)")).toBeNull()
  })

  it("rejects empty or missing values", () => {
    expect(safeNextPath("")).toBeNull()
    expect(safeNextPath(null)).toBeNull()
    expect(safeNextPath(undefined)).toBeNull()
  })

  it("rejects auth routes as redirect targets", () => {
    expect(safeNextPath("/login")).toBeNull()
    expect(safeNextPath("/login?error=oauth")).toBeNull()
    expect(safeNextPath("/register")).toBeNull()
  })
})

describe("getPostLoginPath", () => {
  it("sends admins to the admin console by default", () => {
    expect(getPostLoginPath(["admin"])).toBe("/admin")
  })

  it("sends everyone else to the dashboard by default", () => {
    expect(getPostLoginPath(["learner"])).toBe("/dashboard")
    expect(getPostLoginPath([])).toBe("/dashboard")
  })

  it("honours a safe explicit next path over the role default", () => {
    expect(getPostLoginPath(["learner"], "/dashboard/services")).toBe("/dashboard/services")
  })

  it("ignores an unsafe next path and falls back to the role default", () => {
    expect(getPostLoginPath(["learner"], "//evil.com")).toBe("/dashboard")
    expect(getPostLoginPath(["admin"], "/login")).toBe("/admin")
  })
})