import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")?.trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 })
  }

  if (!/^[A-Z0-9-]{4,64}$/.test(code)) {
    return NextResponse.json({ error: "Invalid verification code format." }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Certificate verification is temporarily unavailable." },
      { status: 503 }
    )
  }

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from("certificates")
      .select("certificate_number, recipient_name, course_title, issue_date, grade, is_valid")
      .eq("verification_code", code)
      .maybeSingle()

    if (error) {
      console.error("Certificate verification query failed:", error)
      return NextResponse.json(
        { error: "Certificate verification is temporarily unavailable." },
        { status: 503 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { status: "not_found", error: "Certificate not found." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      status: data.is_valid ? "valid" : "revoked",
      certificate: {
        certificate_number: data.certificate_number,
        recipient_name: data.recipient_name,
        course_title: data.course_title,
        issue_date: data.issue_date,
        grade: data.grade,
        status: data.is_valid ? "valid" : "revoked",
      },
    })
  } catch (error) {
    console.error("Certificate verification request failed:", error)
    return NextResponse.json(
      { error: "Certificate verification is temporarily unavailable." },
      { status: 503 }
    )
  }
}
