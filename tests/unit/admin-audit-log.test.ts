import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"

const {
  requireAdminApi,
  createClient,
  createAdminClient,
  auditInsert,
  courseMaybeSingle,
} = vi.hoisted(() => {
  const auditInsert = vi.fn(
    async (): Promise<{ error: { code?: string; message?: string } | null }> => ({
      error: null,
    })
  )
  const courseMaybeSingle = vi.fn(async () => ({
    data: { id: "course-1" },
    error: null,
  }))

  const courseBuilder: Record<string, unknown> = {}
  Object.assign(courseBuilder, {
    update: () => courseBuilder,
    eq: () => courseBuilder,
    select: () => courseBuilder,
    maybeSingle: courseMaybeSingle,
  })

  const createClient = vi.fn(async () => ({
    from: () => courseBuilder,
  }))

  const createAdminClient = vi.fn(() => ({
    from: () => ({ insert: auditInsert }),
  }))

  const requireAdminApi = vi.fn()

  return {
    requireAdminApi,
    createClient,
    createAdminClient,
    auditInsert,
    courseMaybeSingle,
  }
})

vi.mock("@/lib/auth/guards", () => ({ requireAdminApi }))
vi.mock("@/lib/supabase/server", () => ({ createClient }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }))
vi.mock("@/lib/certificates/generateCertificatePdf", () => ({
  renderCertificatePdf: vi.fn(),
}))
vi.mock("qrcode", () => ({ default: { toDataURL: vi.fn() } }))

import { POST } from "@/app/api/admin/actions/route"
import {
  auditOutcomeFromStatus,
  extractAuditTarget,
  recordAdminAudit,
} from "@/lib/admin/auditLog"

function adminActionRequest(body: unknown) {
  return new NextRequest("https://tallgate.test/api/admin/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("extractAuditTarget", () => {
  it("returns the first populated target key in priority order", () => {
    expect(extractAuditTarget({ id: "abc" })).toBe("abc")
    expect(extractAuditTarget({ user_id: "u1" })).toBe("u1")
    expect(extractAuditTarget({ course_id: "c1" })).toBe("c1")
    expect(extractAuditTarget({ lesson_id: "l1" })).toBe("l1")
    expect(extractAuditTarget({ id: "abc", user_id: "u1" })).toBe("abc")
  })

  it("trims values and ignores non-string or empty entries", () => {
    expect(extractAuditTarget({ id: "  spaced  " })).toBe("spaced")
    expect(extractAuditTarget({ id: 42, user_id: "u1" })).toBe("u1")
    expect(extractAuditTarget({ id: "   " })).toBeNull()
    expect(extractAuditTarget({})).toBeNull()
  })

  it("caps the stored target length", () => {
    expect(extractAuditTarget({ id: "x".repeat(500) })).toHaveLength(200)
  })
})

describe("auditOutcomeFromStatus", () => {
  it("maps 2xx to success and everything else to failure", () => {
    expect(auditOutcomeFromStatus(200)).toBe("success")
    expect(auditOutcomeFromStatus(204)).toBe("success")
    expect(auditOutcomeFromStatus(299)).toBe("success")
    expect(auditOutcomeFromStatus(400)).toBe("failure")
    expect(auditOutcomeFromStatus(403)).toBe("failure")
    expect(auditOutcomeFromStatus(503)).toBe("failure")
  })
})

describe("recordAdminAudit", () => {
  beforeEach(() => {
    auditInsert.mockReset().mockResolvedValue({ error: null })
    createAdminClient.mockClear()
  })

  it("writes the actor, action, target and outcome", async () => {
    await recordAdminAudit({
      actorId: "admin-1",
      action: "toggle_course_publish",
      target: "course-9",
      outcome: "success",
    })

    expect(auditInsert).toHaveBeenCalledWith({
      actor_id: "admin-1",
      action: "toggle_course_publish",
      target: "course-9",
      outcome: "success",
    })
  })

  it("does not throw when the insert reports an error", async () => {
    auditInsert.mockResolvedValue({ error: { code: "23505" } })
    await expect(
      recordAdminAudit({
        actorId: "admin-1",
        action: "create_course",
        target: null,
        outcome: "failure",
      })
    ).resolves.toBeUndefined()
  })

  it("does not throw when the admin client is unavailable", async () => {
    createAdminClient.mockImplementationOnce(() => {
      throw new Error("missing service role")
    })
    await expect(
      recordAdminAudit({
        actorId: "admin-1",
        action: "create_course",
        target: null,
        outcome: "failure",
      })
    ).resolves.toBeUndefined()
  })

  it("stores sanitized structured details", async () => {
    await recordAdminAudit({
      actorId: "admin-1",
      action: "issue_certificate",
      target: "cert-1",
      outcome: "success",
      details: {
        certificate_type: "course_linked",
        reason: "x".repeat(600),
        retry_count: 2,
        retried: true,
        empty: null,
        nested: { ignored: true },
        list: ["ignored"],
        "": "ignored",
        ["k".repeat(65)]: "ignored",
      },
    })

    expect(auditInsert).toHaveBeenCalledTimes(1)
    expect(auditInsert).toHaveBeenCalledWith({
      actor_id: "admin-1",
      action: "issue_certificate",
      target: "cert-1",
      outcome: "success",
      details: {
        certificate_type: "course_linked",
        reason: "x".repeat(500),
        retry_count: 2,
        retried: true,
        empty: null,
      },
    })
  })

  it("omits details entirely when sanitization leaves nothing", async () => {
    await recordAdminAudit({
      actorId: "admin-1",
      action: "create_course",
      target: null,
      outcome: "success",
      details: { nested: { ignored: true }, list: [1, 2] },
    })

    expect(auditInsert).toHaveBeenCalledWith({
      actor_id: "admin-1",
      action: "create_course",
      target: null,
      outcome: "success",
    })
  })

  it("retries without details when the details column is unavailable", async () => {
    auditInsert
      .mockResolvedValueOnce({
        error: {
          code: "PGRST204",
          message: 'Could not find the "details" column in the schema cache',
        },
      })
      .mockResolvedValueOnce({ error: null })

    await recordAdminAudit({
      actorId: "admin-1",
      action: "issue_certificate",
      target: "cert-1",
      outcome: "failure",
      details: { certificate_type: "independent" },
    })

    expect(auditInsert).toHaveBeenCalledTimes(2)
    expect(auditInsert).toHaveBeenLastCalledWith({
      actor_id: "admin-1",
      action: "issue_certificate",
      target: "cert-1",
      outcome: "failure",
    })
  })
})

describe("POST /api/admin/actions audit logging", () => {
  beforeEach(() => {
    auditInsert.mockReset().mockResolvedValue({ error: null })
    courseMaybeSingle.mockReset().mockResolvedValue({
      data: { id: "course-1" },
      error: null,
    })
    requireAdminApi.mockReset().mockResolvedValue({
      user: { id: "admin-1", roles: ["admin"], profile: null },
      error: null,
    })
  })

  it("records a successful admin action", async () => {
    const response = await POST(
      adminActionRequest({
        action: "toggle_course_popular",
        payload: { id: "course-1", is_popular: true },
      })
    )

    expect(response.status).toBe(200)
    expect(auditInsert).toHaveBeenCalledWith({
      actor_id: "admin-1",
      action: "toggle_course_popular",
      target: "course-1",
      outcome: "success",
    })
  })

  it("records the outcome of a rejected admin action", async () => {
    const response = await POST(
      adminActionRequest({
        action: "toggle_course_popular",
        payload: { id: "course-1", is_popular: "yes" },
      })
    )

    expect(response.status).toBe(400)
    expect(auditInsert).toHaveBeenCalledWith({
      actor_id: "admin-1",
      action: "toggle_course_popular",
      target: "course-1",
      outcome: "failure",
    })
  })

  it("does not write an audit entry for unauthenticated requests", async () => {
    requireAdminApi.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    })

    const response = await POST(adminActionRequest({ action: "create_course", payload: {} }))

    expect(response.status).toBe(401)
    expect(auditInsert).not.toHaveBeenCalled()
  })
})
