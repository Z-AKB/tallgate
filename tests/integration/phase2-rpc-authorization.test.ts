import { randomUUID } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing Supabase credentials in test environment: ${name}`)
  return value
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
const SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")

const TEST_PASSWORD = "test-password-123"

type RestError = { code: string; message: string }
type RestResult<T> = { data: T | null; error: RestError | null; status: number }

type CertificateRow = {
  id: string
  email_status: string | null
  email_lease_token: string | null
  email_error: string | null
  email_retry_count: number | null
}

type ClaimRow = {
  claimed: boolean
  current_status: string | null
  current_lease_token: string | null
  current_retry_count: number | null
}

let testUserId: string
let testCertificateId: string
let testLeaseToken: string
let wrongLeaseToken: string
let testVerificationCode: string

function getErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === "string") return message
  }
  return "Unknown error"
}

async function rest<T>(path: string, apiKey: string, method = "GET", body?: unknown): Promise<RestResult<T>> {
  const headers: Record<string, string> = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = (await res.json().catch(() => null)) as T | null
  return {
    data,
    error: res.ok ? null : { code: res.status.toString(), message: getErrorMessage(data) },
    status: res.status,
  }
}

function rpcCall<T>(functionName: string, params: Record<string, unknown>, apiKey: string): Promise<RestResult<T>> {
  return rest<T>(`rpc/${functionName}`, apiKey, "POST", params)
}

async function createAuthUser(): Promise<string> {
  const email = `rpc-test-${randomUUID()}@example.com`
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
    }),
  })
  const data = (await res.json()) as { id?: string }
  if (!res.ok || !data?.id) {
    throw new Error(`Auth user creation failed: ${getErrorMessage(data)}`)
  }
  return data.id
}

async function deleteAuthUser(userId: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
}

async function insertTestCertificate(userId: string, certificateId: string, verificationCode: string): Promise<void> {
  const result = await rest<CertificateRow[]>("certificates", SERVICE_ROLE_KEY, "POST", {
    id: certificateId,
    verification_code: verificationCode,
    user_id: userId,
    course_id: null,
    certificate_type: "independent",
    issuance_reason: "RPC authorization test fixture",
    recipient_name: "RPC Test User",
    course_title: "RPC Test Course",
    email_status: "pending",
    email_lease_token: null,
    email_lease_acquired_at: null,
    email_retry_count: 0,
    email_sent_at: null,
    email_error: null,
    storage_path: null,
    is_valid: true,
  })
  if (result.error) {
    throw new Error(`Certificate insert failed: ${result.error.message}`)
  }
}

async function deleteCertificate(certificateId: string): Promise<void> {
  await rest<CertificateRow[]>(`certificates?id=eq.${certificateId}`, SERVICE_ROLE_KEY, "DELETE")
}

async function getCertificate(certificateId: string): Promise<CertificateRow | null> {
  const { data } = await rest<CertificateRow[]>(`certificates?id=eq.${certificateId}&select=id,email_status,email_lease_token,email_error,email_retry_count`, SERVICE_ROLE_KEY, "GET")
  return Array.isArray(data) && data[0] ? data[0] : null
}

async function waitForCertificateState(
  certificateId: string,
  predicate: (cert: CertificateRow) => boolean,
  timeoutMs = 10000
): Promise<CertificateRow | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const cert = await getCertificate(certificateId)
    if (cert && predicate(cert)) return cert
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return getCertificate(certificateId)
}

async function claimLease(certificateId: string, leaseToken: string): Promise<ClaimRow> {
  const { data, error } = await rpcCall<ClaimRow[]>(
    "claim_certificate_email_lease",
    { p_certificate_id: certificateId, p_lease_token: leaseToken, p_lease_timeout: "5 minutes" },
    SERVICE_ROLE_KEY
  )
  expect(error).toBeNull()
  expect(Array.isArray(data)).toBe(true)
  const row = data?.[0]
  if (!row) throw new Error("Claim RPC returned no row")
  return row
}

describe("Phase 2: Real PostgREST RPC authorization (disposable project)", () => {
  beforeEach(async () => {
    testUserId = await createAuthUser()
    testCertificateId = randomUUID()
    testLeaseToken = randomUUID()
    wrongLeaseToken = randomUUID()
    testVerificationCode = `TG-RPC-${randomUUID().slice(0, 8).toUpperCase()}`
    await insertTestCertificate(testUserId, testCertificateId, testVerificationCode)
  }, 30000)

  afterEach(async () => {
    if (testCertificateId) {
      await rpcCall<number>("release_stale_certificate_email_leases", { p_lease_timeout_interval: "0 seconds" }, SERVICE_ROLE_KEY)
      await deleteCertificate(testCertificateId)
    }
    if (testUserId) {
      await deleteAuthUser(testUserId)
    }
  }, 30000)

  describe("Service-role API key via raw HTTP (should succeed)", () => {
    it("can claim a certificate email lease", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)
      expect(claim.current_status).toBe("sending")
      expect(claim.current_lease_token).toBe(testLeaseToken)
    })

    it("can complete a certificate email lease with the correct token", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)

      const cert = await waitForCertificateState(
        testCertificateId,
        (c) => c.email_status === "sending" && c.email_lease_token === testLeaseToken
      )
      expect(cert?.email_status).toBe("sending")
      expect(cert?.email_lease_token).toBe(testLeaseToken)

      const { data: completeData, error } = await rpcCall<boolean>(
        "complete_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: testLeaseToken, p_email_status: "sent", p_email_error: null },
        SERVICE_ROLE_KEY
      )
      expect(error).toBeNull()
      expect(completeData).toBe(true)

      const completed = await waitForCertificateState(testCertificateId, (c) => c.email_status === "sent")
      expect(completed?.email_status).toBe("sent")
      expect(completed?.email_lease_token).toBeNull()
    })

    it("can complete a certificate email lease as 'failed'", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)
      await waitForCertificateState(
        testCertificateId,
        (c) => c.email_status === "sending" && c.email_lease_token === testLeaseToken
      )

      const { data, error } = await rpcCall<boolean>(
        "complete_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: testLeaseToken, p_email_status: "failed", p_email_error: "smtp rejected" },
        SERVICE_ROLE_KEY
      )
      expect(error).toBeNull()
      expect(data).toBe(true)

      const failed = await waitForCertificateState(testCertificateId, (c) => c.email_status === "failed")
      expect(failed?.email_status).toBe("failed")
      expect(failed?.email_error).toBe("smtp rejected")
      expect(failed?.email_retry_count).toBe(1)
      expect(failed?.email_lease_token).toBeNull()
    })

    it("can release stale email leases", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)
      await waitForCertificateState(testCertificateId, (c) => c.email_status === "sending")

      const { data, error } = await rpcCall<number>(
        "release_stale_certificate_email_leases",
        { p_lease_timeout_interval: "0 seconds" },
        SERVICE_ROLE_KEY
      )
      expect(error).toBeNull()
      expect(typeof data).toBe("number")
      expect(data).toBeGreaterThanOrEqual(0)
    })

    it("rejects incorrect lease token on completion", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)
      await waitForCertificateState(
        testCertificateId,
        (c) => c.email_status === "sending" && c.email_lease_token === testLeaseToken
      )

      const { data, error } = await rpcCall<boolean>(
        "complete_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: wrongLeaseToken, p_email_status: "sent", p_email_error: null },
        SERVICE_ROLE_KEY
      )
      expect(error).toBeNull()
      expect(data).toBe(false)
    })

    it("rejects duplicate claims when already claimed", async () => {
      const claim1 = await claimLease(testCertificateId, testLeaseToken)
      expect(claim1.claimed).toBe(true)

      const claim2 = await claimLease(testCertificateId, testLeaseToken)
      expect(claim2.claimed).toBe(false)
    })

    it("rejects NULL email status", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)
      await waitForCertificateState(
        testCertificateId,
        (c) => c.email_status === "sending" && c.email_lease_token === testLeaseToken
      )

      const { error } = await rpcCall<boolean>(
        "complete_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: testLeaseToken, p_email_status: null, p_email_error: null },
        SERVICE_ROLE_KEY
      )
      expect(error).not.toBeNull()
    })

    it("rejects invalid email status", async () => {
      const claim = await claimLease(testCertificateId, testLeaseToken)
      expect(claim.claimed).toBe(true)
      await waitForCertificateState(
        testCertificateId,
        (c) => c.email_status === "sending" && c.email_lease_token === testLeaseToken
      )

      const { error } = await rpcCall<boolean>(
        "complete_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: testLeaseToken, p_email_status: "bogus_status", p_email_error: null },
        SERVICE_ROLE_KEY
      )
      expect(error).not.toBeNull()
    })
  })

  describe("Anonymous API key via raw HTTP (should be rejected)", () => {
    it("cannot claim a certificate email lease", async () => {
      const { error } = await rpcCall<ClaimRow[]>(
        "claim_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: testLeaseToken, p_lease_timeout: "5 minutes" },
        ANON_KEY
      )
      expect(error).not.toBeNull()
    })

    it("cannot complete a certificate email lease", async () => {
      const { error } = await rpcCall<boolean>(
        "complete_certificate_email_lease",
        { p_certificate_id: testCertificateId, p_lease_token: testLeaseToken, p_email_status: "sent", p_email_error: null },
        ANON_KEY
      )
      expect(error).not.toBeNull()
    })

    it("cannot release stale email leases", async () => {
      const { error } = await rpcCall<number>(
        "release_stale_certificate_email_leases",
        { p_lease_timeout_interval: "0 seconds" },
        ANON_KEY
      )
      expect(error).not.toBeNull()
    })
  })
})
