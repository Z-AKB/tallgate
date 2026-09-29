import { createClient } from "@/lib/supabase/server"
import type { CurrentUser } from "@/lib/auth/guards"

export type PortalEnrollment = {
  id: string
  status: string
  progress_percent: number
  enrolled_at: string
  completed_at: string | null
  course_title: string
  course_slug: string | null
}

export type PortalOverview = {
  enrollments: PortalEnrollment[]
  activeCourses: number
  startupApplications: number
  serviceRequests: number
}

function mapCourseEnrollment(row: any): PortalEnrollment {
  return {
    id: row.id,
    status: row.status || "active",
    progress_percent: Number(row.progress_percent) || 0,
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at || null,
    course_title: row.courses?.title || "Technical course",
    course_slug: row.courses?.slug || null,
  }
}

export async function getPortalOverview(user: CurrentUser): Promise<PortalOverview> {
  const supabase = createClient()

  const [{ data: courseEnrollments }, { data: legacyEnrollments }, { data: startups }, { data: consultations }] =
    await Promise.all([
      supabase
        .from("course_enrollments")
        .select("id, status, progress_percent, enrolled_at, completed_at, courses(title, slug)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("enrollments")
        .select("id, status, enrolled_at, courses(title, slug)")
        .eq("learner_id", user.id)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("startup_applications")
        .select("id")
        .eq("user_id", user.id),
      supabase
        .from("consultation_requests")
        .select("id")
        .eq("user_id", user.id),
    ])

  const fromCourseTable = (courseEnrollments || []).map(mapCourseEnrollment)
  const fromLegacyTable = (legacyEnrollments || []).map((row: any) => ({
    id: row.id,
    status: row.status || "active",
    progress_percent: row.status === "completed" ? 100 : 0,
    enrolled_at: row.enrolled_at,
    completed_at: null,
    course_title: row.courses?.title || "Technical course",
    course_slug: row.courses?.slug || null,
  }))

  const enrollments = fromCourseTable.length > 0 ? fromCourseTable : fromLegacyTable

  return {
    enrollments,
    activeCourses: enrollments.filter((item) => item.status === "active").length,
    startupApplications: startups?.length || 0,
    serviceRequests: consultations?.length || 0,
  }
}
