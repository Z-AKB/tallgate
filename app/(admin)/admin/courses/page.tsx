import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockCourses, type MockCourse } from "@/lib/data/adminMockData"
import { toCourse } from "@/lib/data/adminRowMappers"
import CoursesClient from "@/components/admin/CoursesClient"

export const metadata = {
  title: "Course Curriculum Management | TallGate Admin",
  description: "Author, publish, and maintain the Learning Hub course catalogue.",
}

export default async function AdminCoursesPage() {
  const supabase = await createClient()
  const useMockData = !isSupabaseConfigured() && process.env.NODE_ENV === "development"

  // Mock data is only ever a development placeholder for an unconfigured
  // project. Once Supabase answers, its result is authoritative even when it
  // is empty: a zero-row table must render as empty, never as seeded rows.
  let courses: MockCourse[] = useMockData ? mockCourses : []
  let dataWarning = ""

  if (!isSupabaseConfigured()) {
    dataWarning = useMockData
      ? "Supabase is not configured, so this catalogue is showing sample data."
      : "Courses are unavailable because Supabase is not configured."
  } else {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Admin courses query failed:", error)
        dataWarning = "Courses could not be loaded. This catalogue may be incomplete."
      } else {
        courses = (data ?? []).map(toCourse)
      }
    } catch (err) {
      console.error("Admin courses query failed:", err)
      dataWarning = "Courses could not be loaded. This catalogue may be incomplete."
    }
  }

  return (
    <div className="space-y-6">
      {dataWarning && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          {dataWarning}
        </div>
      )}
      <CoursesClient initialCourses={courses} />
    </div>
  )
}