import React from "react"
import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import type { MockCourse } from "@/lib/data/adminMockData"
import { coursesData } from "@/lib/data/courses"
import { toCourse } from "@/lib/data/adminRowMappers"
import { ADMIN_QUERY_LIMIT } from "@/lib/admin/queryLimits"
import CoursesClient from "@/components/admin/CoursesClient"

export const metadata = {
  title: "Course Curriculum Management | TallGate Admin",
  description: "Author, publish, and maintain the Learning Hub course catalogue.",
}

// The public catalogue in lib/data/courses.ts is the fallback list of domains.
// Once Supabase answers, the admin-managed `course_categories` table is
// authoritative so the admin curriculum and the Learning Hub stay aligned.
const fallbackDomains = Array.from(new Set(coursesData.map((course) => course.category)))

export default async function AdminCoursesPage() {
  const supabase = await createClient()

  // Never present mock courses as real records: an empty (or unconfigured)
  // catalogue renders the seed empty state instead.
  let courses: MockCourse[] = []
  let knownDomains: string[] = fallbackDomains
  let dataWarning = ""

  if (!isSupabaseConfigured()) {
    dataWarning = "Courses are unavailable because Supabase is not configured."
  } else {
    try {
      const [coursesResult, categoriesResult] = await Promise.all([
        supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(ADMIN_QUERY_LIMIT),
        supabase
          .from("course_categories")
          .select("name")
          .order("display_order", { ascending: true }),
      ])

      if (coursesResult.error) {
        console.error("Admin courses query failed:", coursesResult.error)
        dataWarning = "Courses could not be loaded. This catalogue may be incomplete."
      } else {
        courses = (coursesResult.data ?? []).map(toCourse)
        if (courses.length === ADMIN_QUERY_LIMIT) {
          dataWarning = `Showing the ${ADMIN_QUERY_LIMIT} most recent courses. Older records are not displayed.`
        }
      }

      if (categoriesResult.error) {
        console.error("Admin course categories query failed:", categoriesResult.error)
      } else if (categoriesResult.data && categoriesResult.data.length > 0) {
        knownDomains = categoriesResult.data.map((category) => category.name)
      }
    } catch (err) {
      console.error("Admin courses query failed:", err)
      dataWarning = "Courses could not be loaded. This catalogue may be incomplete."
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/course-content"
        className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
      >
        Manage lesson materials and live classes
      </Link>
      {dataWarning && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          {dataWarning}
        </div>
      )}
      <CoursesClient initialCourses={courses} knownDomains={knownDomains} />
    </div>
  )
}
