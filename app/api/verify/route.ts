import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { logError } from "@/lib/logging/logger"

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

// Concurrency protection: bounded simultaneous verification operations.
// Prevents resource exhaustion without creating persistent rate-limit
// records for arbitrary verification codes. Does not depend on client IP
// detection or forwarding headers.
const MAX_CONCURRENT_VERIFICATIONS = 20
let activeVerificationCount = 0

function tryAcquireVerificationSlot(): boolean {
  if (activeVerificationCount >= MAX_CONCURRENT_VERIFICATIONS) return false
  activeVerificationCount++
  return true
}

function releaseVerificationSlot(): void {
  activeVerificationCount = Math.max(0, activeVerificationCount - 1)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")?.trim().toUpperCase()

  if (!code) {
    return noStore({ error: "Code is required" }, 400)
  }

  if (!/^[A-Z0-9-]{4,64}$/.test(code)) {
    return noStore({ error: "Invalid verification code format." }, 400)
  }

  if (!isSupabaseConfigured()) {
    return noStore(
      { error: "Certificate verification is temporarily unavailable." },
      503
    )
  }

  if (!tryAcquireVerificationSlot()) {
    return noStore(
      { error: "Too many concurrent verification requests. Please try again." },
      503
    )
  }

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .rpc("verify_certificate", {
        p_verification_code: code,
      })
      .abortSignal(AbortSignal.timeout(10000))

    if (error) {
      logError("verify.lookup_failed", error)
      return noStore(
        { error: "Certificate verification is temporarily unavailable." },
        503
      )
    }

    const certificate = data?.[0]
    if (!certificate) {
      return noStore(
        { status: "not_found", error: "Certificate not found." },
        404
      )
    }

    return noStore(
      {
        status: certificate.is_valid ? "valid" : "revoked",
        certificate: {
          certificate_number: certificate.certificate_number,
          course_title: certificate.course_title,
          issue_date: certificate.issue_date,
          status: certificate.is_valid ? "valid" : "revoked",
        },
      },
      200
    )
  } catch (error) {
    logError("verify.request_failed", error)
    return noStore(
      { error: "Certificate verification is temporarily unavailable." },
      503
    )
  } finally {
    releaseVerificationSlot()
  }
}
