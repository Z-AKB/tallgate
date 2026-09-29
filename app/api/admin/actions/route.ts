import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdminApi } from "@/lib/auth/guards"

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminApi()
    if (admin.error) return admin.error

    const body = await req.json()
    const { action, payload } = body

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    const supabase = createClient()

    switch (action) {
      case "update_consultation_status": {
        const { id, status, admin_notes } = payload
        const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
        if (admin_notes !== undefined) updateData.admin_notes = admin_notes

        const { error } = await (supabase.from("consultation_requests") as any)
          .update(updateData)
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Consultation status updated" })
      }

      case "update_startup_status": {
        const { id, status } = payload
        const { error } = await (supabase.from("startup_applications") as any)
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Startup application status updated" })
      }

      case "toggle_course_publish": {
        const { id, is_published } = payload
        const { error } = await (supabase.from("courses") as any)
          .update({ is_published })
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Course status updated" })
      }

      case "toggle_course_popular": {
        const { id, is_popular } = payload
        const { error } = await (supabase.from("courses") as any)
          .update({ is_popular })
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Course popularity updated" })
      }

      case "issue_certificate": {
        const {
          recipient_name,
          course_title,
          course_id,
          user_id,
          verification_code,
          grade,
          issue_date,
        } = payload

        const generatedCode =
          verification_code || `TG-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

        const { error } = await (supabase.from("certificates") as any).insert([
          {
            recipient_name,
            course_title,
            course_id: course_id || null,
            user_id: user_id || admin.user.id,
            verification_code: generatedCode,
            grade: grade || "Distinction",
            issue_date: issue_date || new Date().toISOString().split("T")[0],
            is_valid: true,
          },
        ])

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: "Certificate issued successfully",
          verification_code: generatedCode,
        })
      }

      case "toggle_certificate_validity": {
        const { id, is_valid } = payload
        const { error } = await (supabase.from("certificates") as any)
          .update({ is_valid })
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Certificate validity toggled" })
      }

      case "update_message_status": {
        const { id, status } = payload
        const { error } = await (supabase.from("contact_messages") as any)
          .update({ status })
          .eq("id", id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true, message: "Message status updated" })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Admin action API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
