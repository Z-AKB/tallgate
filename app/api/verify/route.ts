import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server"

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")?.trim().toUpperCase()

  if (!code) {
    return noStore({ error: "Code is required" }, 400)
  }

  if (!/^[A-Z0-9-]{4,64}$/.test(code)) {
    return noStore({ error: "Invalid verification code format." }, 400)
  }

  if (!isSupabaseConfigured()) {
    return noStore(
      { error: "Certificate verification is temporarily unavailable." },
      503
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
      return noStore(
        { error: "Certificate verification is temporarily unavailable." },
        503
      )
    }

    if (!data) {
      return noStore(
        { status: "not_found", error: "Certificate not found." },
        404
      )
    }

    return noStore(
      {
        status: data.is_valid ? "valid" : "revoked",
        certificate: {
          certificate_number: data.certificate_number,
          recipient_name: data.recipient_name,
          course_title: data.course_title,
          issue_date: data.issue_date,
          grade: data.grade,
          status: data.is_valid ? "valid" : "revoked",
        },
      },
      200
    )
  } catch (error) {
    console.error("Certificate verification request failed:", error)
    return noStore(
      { error: "Certificate verification is temporarily unavailable." },
      503
    )
  }
}
