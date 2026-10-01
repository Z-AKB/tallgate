import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockCourses, MockCourse } from "@/lib/data/adminMockData"
import { toCourse } from "@/lib/data/adminRowMappers"
import CoursesClient from "@/components/admin/CoursesClient"

export const metadata = {
  title: "Academy Course Catalog | TallGate Admin",
  description: "Manage learning hub curricula, course pricing in NGN, and publishing status.",
}

export default async function AdminCoursesPage() {
  const supabase = createClient()
  let courses: MockCourse[] = mockCourses

  if (isSupabaseConfigured()) try {
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("display_order", { ascending: true })

    if (data && data.length > 0) {
      courses = data.map((item) => ({ ...toCourse(item), enrollment_count: 45 }))
    }
  } catch (err) {
    console.warn("Supabase courses query fallback:", err)
  }

  return <CoursesClient initialCourses={courses} />
}
