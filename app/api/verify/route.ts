import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server"
import {
  checkRateLimit,
  rateLimitResponse,
  rateLimitUnavailableResponse,
  RateLimitUnavailableError,
} from "@/lib/api/rateLimit"

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
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

  try {
    if (!(await checkRateLimit(req, "verification", 30, 900))) {
      const response = rateLimitResponse(900)
      response.headers.set("Cache-Control", "no-store")
      return response
    }

    const supabase = createPublicClient()
    const { data, error } = await supabase.rpc("verify_certificate", {
      p_verification_code: code,
    })

    if (error) {
      console.error("Certificate verification query failed:", error)
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
    if (error instanceof RateLimitUnavailableError) {
      const response = rateLimitUnavailableResponse()
      response.headers.set("Cache-Control", "no-store")
      return response
    }
    console.error("Certificate verification request failed:", error)
    return noStore(
      { error: "Certificate verification is temporarily unavailable." },
      503
    )
  }
}
