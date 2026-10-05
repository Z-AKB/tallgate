import { NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { isNonEmptyString } from "@/lib/utils"
import {
  isNonEmptyText,
  isOptionalText,
  isValidEmailAddress,
  readJsonObject,
} from "@/lib/api/request"
import {
  checkRateLimit,
  rateLimitResponse,
  rateLimitUnavailableResponse,
  RateLimitUnavailableError,
} from "@/lib/api/rateLimit"

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonObject(req)
    if (parsed.response) return parsed.response
    const { fullName, email, phone, subject, message } = parsed.data

    if (
      !isNonEmptyText(fullName, 120) ||
      !isValidEmailAddress(email) ||
      !isNonEmptyText(message, 10000) ||
      !isOptionalText(phone, 40) ||
      !isOptionalText(subject, 160)
    ) {
      return NextResponse.json(
        { error: "Please provide valid name, email, phone, subject, and message values." },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Message submission is temporarily unavailable." },
        { status: 503 }
      )
    }

    if (!(await checkRateLimit(req, "contact", 5, 900))) {
      return rateLimitResponse(900)
    }

    const supabase = await createClient()

    const { error: dbError } = await supabase.from("contact_messages").insert([
      {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: isNonEmptyString(phone) ? phone.trim() : null,
        subject: isNonEmptyString(subject) ? subject.trim() : "General Inquiry",
        message: message.trim(),
        status: "unread",
      },
    ])

    if (dbError) {
      console.error("Contact database insert failed:", dbError)
      return NextResponse.json(
        { error: "Message could not be saved. Please try again." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Message sent successfully." },
      { status: 200 }
    )
  } catch (error: unknown) {
    if (error instanceof RateLimitUnavailableError) {
      return rateLimitUnavailableResponse()
    }
    console.error("Contact API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
