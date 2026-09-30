import { NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
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
    } = body

    if (!companyName || !founderName || !email || !phone || !problemStatement || !solutionDescription) {
      return NextResponse.json(
        { error: "Please provide all required fields." },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Startup applications are temporarily unavailable." },
        { status: 503 }
      )
    }

    const supabase = createClient()

    const { error: dbError } = await (supabase.from("startup_applications") as any).insert([
      {
        company_name: companyName,
        founder_name: founderName,
        email,
        phone,
        industry,
        stage: stage || "mvp",
        problem_statement: problemStatement,
        solution_description: solutionDescription,
        pitch_deck_url: pitchDeckUrl || null,
        support_needed: supportNeeded || [],
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
  } catch (error: any) {
    console.error("Startup API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
