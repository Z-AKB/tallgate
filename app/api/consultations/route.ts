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
    const {
      fullName,
      email,
      phone,
      companyName,
      serviceInterest,
      projectScope,
      budgetRange,
      timeline,
    } = parsed.data

    if (
      !isNonEmptyText(fullName, 120) ||
      !isValidEmailAddress(email) ||
      !isNonEmptyText(phone, 40) ||
      !isNonEmptyText(serviceInterest, 160) ||
      !isNonEmptyText(projectScope, 10000) ||
      !isOptionalText(companyName, 160) ||
      !isOptionalText(budgetRange, 100) ||
      !isOptionalText(timeline, 100)
    ) {
      return NextResponse.json(
        { error: "Please provide all required fields." },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Consultation requests are temporarily unavailable." },
        { status: 503 }
      )
    }

    if (!(await checkRateLimit(req, "consultation", 3, 900))) {
      return rateLimitResponse(900)
    }

    const supabase = await createClient()

    const { error: dbError } = await supabase.from("consultation_requests").insert([
      {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company_name: isNonEmptyString(companyName) ? companyName.trim() : null,
        service_interest: serviceInterest.trim(),
        project_scope: projectScope.trim(),
        budget_range: isNonEmptyString(budgetRange) ? budgetRange.trim() : "Not specified",
        timeline: isNonEmptyString(timeline) ? timeline.trim() : "Not specified",
        status: "pending",
      },
    ])

    if (dbError) {
      console.error("Consultation database insert failed:", dbError)
      return NextResponse.json(
        { error: "Consultation request could not be saved. Please try again." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Consultation request received successfully." },
      { status: 200 }
    )
  } catch (error: unknown) {
    if (error instanceof RateLimitUnavailableError) {
      return rateLimitUnavailableResponse()
    }
    console.error("Consultation API error:", error)
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    )
  }
}
