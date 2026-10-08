import { describe, expect, it } from "vitest"
import { getPortalPresentation, uniqueRoles } from "@/lib/auth/roles"

describe("uniqueRoles", () => {
  it("drops nullish values and de-duplicates", () => {
    expect(uniqueRoles(["learner", null, "admin", "learner", undefined])).toEqual([
      "learner",
      "admin",
    ])
  })

  it("returns an empty array when there are no roles", () => {
    expect(uniqueRoles([null, undefined])).toEqual([])
  })
})

describe("getPortalPresentation", () => {
  it("labels admins as the admin portal", () => {
    expect(getPortalPresentation(["admin"])).toEqual({
      isAdmin: true,
      isLearner: false,
      portalLabel: "Admin Portal",
    })
  })

  it("treats admins as non-learners even with a learner role", () => {
    const presentation = getPortalPresentation(["admin", "learner"])
    expect(presentation.isAdmin).toBe(true)
    expect(presentation.isLearner).toBe(false)
    expect(presentation.portalLabel).toBe("Admin Portal")
  })

  it("labels a lone learner as the student portal", () => {
    expect(getPortalPresentation(["learner"]).portalLabel).toBe("Student Portal")
  })

  it("labels multi-role non-admins as the multi-role portal", () => {
    const presentation = getPortalPresentation(["learner", "startup_founder"])
    expect(presentation.isLearner).toBe(true)
    expect(presentation.portalLabel).toBe("Multi-role Portal")
  })

  it("maps single non-learner roles to a friendly label", () => {
    expect(getPortalPresentation(["instructor"]).portalLabel).toBe("Instructor Portal")
    expect(getPortalPresentation(["startup_founder"]).portalLabel).toBe("Founder Portal")
    expect(getPortalPresentation(["business_owner"]).portalLabel).toBe("Business Portal")
  })

  it("falls back to the account portal when no roles exist", () => {
    expect(getPortalPresentation([]).portalLabel).toBe("Account Portal")
  })
})