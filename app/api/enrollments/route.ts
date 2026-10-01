import { NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

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
    const body = await req.json()
    const { fullName, email, phone, courseTitle, schedulePreference, learningMode } = body

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof courseTitle !== "string" ||
      !courseTitle.trim()
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

    const supabase = createClient()
    const { error: dbError } = await (supabase.from("service_inquiries") as any).insert([
      {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company_name: `Enrollment: ${courseTitle.trim()} (${learningMode || "Hybrid"}, ${schedulePreference || "Standard"})`,
        message: `Applicant requested enrollment for course ${courseTitle.trim()}. Schedule: ${schedulePreference || "Standard"}. Mode: ${learningMode || "Hybrid"}.`,
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
    console.error("Enrollment API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
