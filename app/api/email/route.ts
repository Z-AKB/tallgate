import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/email
 * Sends a transactional email via Resend.
 * Required env: RESEND_API_KEY, RESEND_FROM_EMAIL (optional, defaults shown below)
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured — email sending skipped.")
    return NextResponse.json(
      { error: "Email sending is not configured." },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { to, subject, html, text } = body

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, and html or text." },
        { status: 400 }
      )
    }

    const from =
      process.env.RESEND_FROM_EMAIL || "TallGate <noreply@tallgate.com>"

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, text }),
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
    console.error("Email API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
