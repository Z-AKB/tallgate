import { describe, expect, it } from "vitest"
import { getPageMeta } from "@/components/admin/Pagination"

describe("getPageMeta", () => {
  it("reports a single page when everything fits", () => {
    expect(getPageMeta(10, 1, 25)).toEqual({ pageCount: 1, safePage: 1, from: 1, to: 10 })
  })

  it("computes windows across multiple pages", () => {
    expect(getPageMeta(60, 1, 25)).toEqual({ pageCount: 3, safePage: 1, from: 1, to: 25 })
    expect(getPageMeta(60, 2, 25)).toEqual({ pageCount: 3, safePage: 2, from: 26, to: 50 })
    expect(getPageMeta(60, 3, 25)).toEqual({ pageCount: 3, safePage: 3, from: 51, to: 60 })
  })

  it("clamps an out-of-range page into the valid range", () => {
    expect(getPageMeta(60, 99, 25).safePage).toBe(3)
    expect(getPageMeta(60, 0, 25).safePage).toBe(1)
    expect(getPageMeta(60, -4, 25).safePage).toBe(1)
  })

  it("reports an empty window for zero rows", () => {
    expect(getPageMeta(0, 1, 25)).toEqual({ pageCount: 1, safePage: 1, from: 0, to: 0 })
  })

  it("handles an exact multiple at the boundary page", () => {
    expect(getPageMeta(50, 2, 25)).toEqual({ pageCount: 2, safePage: 2, from: 26, to: 50 })
  })
})
