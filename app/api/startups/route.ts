import { NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { isNonEmptyString, isOneOf } from "@/lib/utils"

const STARTUP_STAGES = [
  "idea",
  "prototype",
  "mvp",
  "early_revenue",
  "scaling",
] as const

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
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
    } = (body ?? {}) as Record<string, unknown>

    if (
      !isNonEmptyString(companyName) ||
      !isNonEmptyString(founderName) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(phone) ||
      !isNonEmptyString(problemStatement) ||
      !isNonEmptyString(solutionDescription)
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

    const supabase = createClient()

    const { error: dbError } = await supabase.from("startup_applications").insert([
      {
        company_name: companyName,
        founder_name: founderName,
        email,
        phone,
        industry: isNonEmptyString(industry) ? industry : "Not specified",
        stage: isOneOf(STARTUP_STAGES, stage) ? stage : "mvp",
        problem_statement: problemStatement,
        solution_description: solutionDescription,
        pitch_deck_url: isNonEmptyString(pitchDeckUrl) ? pitchDeckUrl : null,
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
    console.error("Startup API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
