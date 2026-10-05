import { NextRequest, NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isNonEmptyString, isOneOf } from "@/lib/utils"
import {
  isNonEmptyText,
  isOptionalText,
  isValidEmailAddress,
  isValidHttpUrl,
  readJsonObject,
} from "@/lib/api/request"
import {
  checkRateLimit,
  rateLimitResponse,
  rateLimitUnavailableResponse,
  RateLimitUnavailableError,
} from "@/lib/api/rateLimit"

const STARTUP_STAGES = [
  "idea",
  "prototype",
  "mvp",
  "early_revenue",
  "scaling",
] as const

export async function POST(req: NextRequest) {
  try {
    const parsed = await readJsonObject(req)
    if (parsed.response) return parsed.response
    const {
      companyName,
      founderName,
      email,
      phone,
      industry,
      stage,
      problemStatement,
      solutionDescription,
      pitchDeckUrl,
      supportNeeded,
    } = parsed.data

    if (
      !isNonEmptyText(companyName, 160) ||
      !isNonEmptyText(founderName, 120) ||
      !isValidEmailAddress(email) ||
      !isNonEmptyText(phone, 40) ||
      !isNonEmptyText(problemStatement, 5000) ||
      !isNonEmptyText(solutionDescription, 5000) ||
      !isOptionalText(industry, 100) ||
      !Array.isArray(supportNeeded) ||
      supportNeeded.length > 12 ||
      supportNeeded.some((item) => !isNonEmptyText(item, 200)) ||
      (pitchDeckUrl !== undefined &&
        pitchDeckUrl !== null &&
        pitchDeckUrl !== "" &&
        !isValidHttpUrl(pitchDeckUrl))
    ) {
      return NextResponse.json(
        { error: "Please provide all required fields." },
        { status: 400 }
      )
    }

    if (!isOneOf(STARTUP_STAGES, stage) && stage !== undefined) {
      return NextResponse.json({ error: "Invalid startup stage." }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Startup applications are temporarily unavailable." },
        { status: 503 }
      )
    }

    if (!(await checkRateLimit(req, "startup", 3, 900))) {
      return rateLimitResponse(900)
    }

    const supabase = createAdminClient()

    const { error: dbError } = await supabase.from("startup_applications").insert([
      {
        company_name: companyName.trim(),
        founder_name: founderName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        industry: isNonEmptyString(industry) ? industry.trim() : "Not specified",
        stage: isOneOf(STARTUP_STAGES, stage) ? stage : "mvp",
        problem_statement: problemStatement.trim(),
        solution_description: solutionDescription.trim(),
        pitch_deck_url: isNonEmptyString(pitchDeckUrl) ? pitchDeckUrl.trim() : null,
        support_needed: Array.isArray(supportNeeded) ? supportNeeded : [],
        status: "submitted",
      },
    ])

    if (dbError) {
      console.error("Startup application database insert failed:", dbError)
      return NextResponse.json(
        { error: "Application could not be saved. Please try again." },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Application received successfully." },
      { status: 200 }
    )
  } catch (error: unknown) {
    if (error instanceof RateLimitUnavailableError) {
      return rateLimitUnavailableResponse()
    }
    console.error("Startup API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
