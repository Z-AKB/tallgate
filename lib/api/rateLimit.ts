import { createHmac } from "node:crypto"
import { isIP } from "node:net"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type RateLimitBucket =
  | "contact"
  | "consultation"
  | "startup"
  | "enrollment"
  | "email"

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Request rate limiting is unavailable.")
    this.name = "RateLimitUnavailableError"
  }
}

function getClientIp(request: NextRequest): string {
  for (const header of ["x-real-ip", "cf-connecting-ip"]) {
    const address = request.headers.get(header)?.trim()
    if (address && isIP(address)) return address
  }
  if (process.env.NODE_ENV !== "production") return "127.0.0.1"

  throw new RateLimitUnavailableError()
}

export async function checkRateLimit(
  request: NextRequest,
  bucket: RateLimitBucket,
  limit: number,
  windowSeconds: number,
  identity?: string
): Promise<boolean> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new RateLimitUnavailableError()

  const key = identity ?? getClientIp(request)
  const keyHash = createHmac("sha256", serviceRoleKey)
    .update(`${bucket}:${key}`)
    .digest("hex")

  try {
    const { data, error } = await createAdminClient().rpc(
      "consume_public_rate_limit",
      {
        p_bucket: bucket,
        p_key_hash: keyHash,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      }
    )

    if (error || typeof data !== "boolean") {
      console.error("Rate-limit check failed:", error)
      throw new RateLimitUnavailableError()
    }

    return data
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) throw error
    console.error("Rate-limit check failed:", error)
    throw new RateLimitUnavailableError()
  }
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait before trying again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  )
}

export function rateLimitUnavailableResponse() {
  return NextResponse.json(
    { error: "This service is temporarily unavailable. Please try again later." },
    { status: 503 }
  )
}
