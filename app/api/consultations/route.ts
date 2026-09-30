import { NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, phone, companyName, serviceInterest, projectScope, budgetRange, timeline } = body

    if (!fullName || !email || !phone || !serviceInterest || !projectScope) {
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

    const supabase = createClient()

    const { error: dbError } = await (supabase.from("consultation_requests") as any).insert([
      {
        full_name: fullName,
        email,
        phone,
        company_name: companyName || null,
        service_interest: serviceInterest,
        project_scope: projectScope,
        budget_range: budgetRange || "Not specified",
        timeline: timeline || "Not specified",
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
  } catch (error: any) {
    console.error("Consultation API error:", error)
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    )
  }
}
