import { NextRequest, NextResponse } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { readJsonObject, isValidEmailAddress } from "@/lib/api/request"
import {
  checkRateLimit,
  rateLimitUnavailableResponse,
  RateLimitUnavailableError,
} from "@/lib/api/rateLimit"

/**
 * POST /api/email
 * Sends an administrator-authorized transactional email via Resend.
 * Required env: RESEND_API_KEY, RESEND_FROM_EMAIL
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdminApi()
  if (admin.error) return admin.error

  const parsed = await readJsonObject(req, 64 * 1024)
  if (parsed.response) return parsed.response

  const { to, subject, html, text } = parsed.data
  const recipients = typeof to === "string" ? [to] : to
  if (
    !Array.isArray(recipients) ||
    recipients.length === 0 ||
    recipients.length > 10 ||
    !recipients.every(isValidEmailAddress) ||
    typeof subject !== "string" ||
    subject.trim().length === 0 ||
    subject.trim().length > 200 ||
    (html !== undefined &&
      (typeof html !== "string" || html.length === 0 || html.length > 50000)) ||
    (text !== undefined &&
      (typeof text !== "string" || text.length === 0 || text.length > 50000)) ||
    (html === undefined && text === undefined)
  ) {
    return NextResponse.json(
      { error: "Provide valid recipients, a subject, and an email body." },
      { status: 400 }
    )
  }

  try {
    if (!(await checkRateLimit(req, "email", 20, 3600, `admin:${admin.user.id}`))) {
      return NextResponse.json(
        { error: "Email send limit reached. Please wait before trying again." },
        { status: 429, headers: { "Retry-After": "3600" } }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    if (!apiKey || !from) {
      console.warn("Email sending is not configured.")
      return NextResponse.json(
        { error: "Email sending is not configured." },
        { status: 503 }
      )
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: subject.trim(),
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Resend API error:", data)
      return NextResponse.json(
        { error: data?.message || "Failed to send email." },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, id: data.id })
  } catch (error: unknown) {
    if (error instanceof RateLimitUnavailableError) {
      return rateLimitUnavailableResponse()
    }
    console.error("Email API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
