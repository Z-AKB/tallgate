import { describe, expect, it } from "vitest"

/**
 * Environment isolation guard test.
 * Verifies that the authoritative integration vitest config loaded .env.test,
 * enforced the disposable project, and that tests run against it only.
 */
describe("Environment isolation", () => {
  it("loads the disposable project URL, not production", () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(url).toBe("https://okyewwtmnqknkittzxvo.supabase.co")
  })

  it("does not target the production project ref", () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(url).toBeDefined()
    expect(url).not.toContain("zlmbitphlzokjmfwldcb")
  })

  it("has anon key configured", () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeTruthy()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0).toBeGreaterThan(10)
  })

  it("has service role key configured", () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy()
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0).toBeGreaterThan(10)
  })

  it("has test site URL configured", () => {
    expect(process.env.NEXT_PUBLIC_SITE_URL).toBe("https://tallgate-certificate-validation.example.com")
  })
})
