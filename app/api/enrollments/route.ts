import { NextRequest, NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

/**
 * POST /api/enrollments
 * Handles course enrollment intake from both guests and authenticated users.
 * 
 * NOTE: This intentionally writes to `service_inquiries` (as a lead/application) 
 * instead of `course_enrollments`. 
 * 
 * The manual admin workflow is:
 * 1. Admin reviews application in /admin/inquiries
 * 2. Admin contacts applicant and confirms payment
 * 3. Admin manually creates a user account (if guest)
 * 4. Admin manually inserts a record into `course_enrollments` to grant lesson player access.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonObject(req)
    if (parsed.response) return parsed.response
    const { fullName, email, phone, courseTitle, schedulePreference, learningMode } =
      parsed.data

    if (
      !isNonEmptyText(fullName, 120) ||
      !isValidEmailAddress(email) ||
      !isNonEmptyText(phone, 40) ||
      !isNonEmptyText(courseTitle, 200) ||
      !isOptionalText(schedulePreference, 120) ||
      !isOptionalText(learningMode, 120)
    ) {
      return NextResponse.json(
        { error: "Missing required enrollment information." },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Enrollment requests are temporarily unavailable." },
        { status: 503 }
      )
    }

    if (!(await checkRateLimit(req, "enrollment", 5, 900))) {
      return rateLimitResponse(900)
    }

    const supabase = createAdminClient()
    const { error: dbError } = await supabase.from("service_inquiries").insert([
      {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company_name: `Enrollment: ${courseTitle.trim()} (${
          isNonEmptyString(learningMode) ? learningMode : "Hybrid"
        }, ${isNonEmptyString(schedulePreference) ? schedulePreference : "Standard"})`,
        message: `Applicant requested enrollment for course ${courseTitle.trim()}. Schedule: ${
          isNonEmptyString(schedulePreference) ? schedulePreference : "Standard"
        }. Mode: ${isNonEmptyString(learningMode) ? learningMode : "Hybrid"}.`,
        status: "new",
      },
    ])

    if (dbError) {
      console.error("Enrollment database insert failed:", dbError)
      return NextResponse.json(
        { error: "Enrollment request could not be saved. Please try again." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Enrollment application received." },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof RateLimitUnavailableError) {
      return rateLimitUnavailableResponse()
    }
    console.error("Enrollment API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
