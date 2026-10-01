import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockEnrollments, MockEnrollment } from "@/lib/data/adminMockData"
import { toEnrollment } from "@/lib/data/adminRowMappers"
import EnrollmentsClient from "@/components/admin/EnrollmentsClient"

export const metadata = {
  title: "Student Cohorts & Enrollments | TallGate Admin",
  description: "Monitor student progression, completion rates, and cohort velocity.",
}

export default async function AdminEnrollmentsPage() {
  const supabase = createClient()
  let enrollments: MockEnrollment[] = mockEnrollments

  if (isSupabaseConfigured()) try {
    const { data } = await supabase
      .from("course_enrollments")
      .select("*, profiles(full_name, email), courses(title)")
      .order("enrolled_at", { ascending: false })

    if (data && data.length > 0) {
      enrollments = data.map((item) => toEnrollment(item, "Enrolled Student", "Technical Track"))
    }
  } catch (err) {
    console.warn("Supabase enrollments fallback:", err)
  }

  return <EnrollmentsClient initialEnrollments={enrollments} />
}
