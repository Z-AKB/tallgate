import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockEnrollments, MockEnrollment } from "@/lib/data/adminMockData"
import EnrollmentsClient from "@/components/admin/EnrollmentsClient"

export const metadata = {
  title: "Student Cohorts & Enrollments | TallGate Admin",
  description: "Monitor student progression, completion rates, and cohort velocity.",
}

export default async function AdminEnrollmentsPage() {
  const supabase = createClient()
  let enrollments: MockEnrollment[] = mockEnrollments

  if (isSupabaseConfigured()) try {
    const { data, error } = await (supabase.from("course_enrollments") as any)
      .select("*, profiles(full_name, email), courses(title)")
      .order("enrolled_at", { ascending: false })

    if (data && data.length > 0) {
      enrollments = data.map((item: any) => ({
        id: item.id,
        user_name: item.profiles?.full_name || "Enrolled Student",
        user_email: item.profiles?.email || "student@tallgate.com",
        course_title: item.courses?.title || "Technical Track",
        status: item.status,
        progress_percent: item.progress_percent || 0,
        enrolled_at: item.enrolled_at,
        completed_at: item.completed_at,
      }))
    }
  } catch (err) {
    console.warn("Supabase enrollments fallback:", err)
  }

  return <EnrollmentsClient initialEnrollments={enrollments} />
}
