import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, phone, courseTitle, schedulePreference, learningMode } = body

    if (!fullName || !email || !phone || !courseTitle) {
      return NextResponse.json(
        { error: "Missing required enrollment information." },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Find course if exists
    const { data: courseData } = await supabase
      .from("courses")
      .select("id")
      .ilike("title", `%${courseTitle}%`)
      .limit(1)
      .single()

    // Record inquiry/enrollment
    const { error: dbError } = await (supabase.from("service_inquiries") as any).insert([
      {
        full_name: fullName,
        email,
        phone,
        company_name: `Enrollment: ${courseTitle} (${learningMode || 'Hybrid'}, ${schedulePreference || 'Standard'})`,
        message: `Applicant enrolled for course ${courseTitle}. Schedule: ${schedulePreference}. Mode: ${learningMode}.`,
        status: "new",
      },
    ])

    if (dbError) {
      console.warn("Enrollment database record warning (fallback mode):", dbError.message)
    }

    return NextResponse.json(
      { success: true, message: "Enrollment application received." },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Enrollment API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
