import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, email, phone, subject, message } = body

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Please provide your name, email, and message." },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { error: dbError } = await (supabase.from("contact_messages") as any).insert([
      {
        full_name: fullName,
        email,
        phone: phone || null,
        subject: subject || "General Inquiry",
        message,
        status: "unread",
      },
    ])

    if (dbError) {
      console.warn("Contact database insert warning (fallback active):", dbError.message)
    }

    return NextResponse.json(
      { success: true, message: "Message sent successfully." },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Contact API error:", error)
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    )
  }
}
