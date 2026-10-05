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

export async function getPortalOverview(user: CurrentUser): Promise<PortalOverview> {
  const supabase = await createClient()

  const [{ data: courseEnrollments }, { data: startups }, { data: consultations }] =
    await Promise.all([
      supabase
        .from("course_enrollments")
        .select("id, status, progress_percent, enrolled_at, completed_at, courses(title, slug)")
        .eq("user_id", user.id)
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

  const enrollments: PortalEnrollment[] = (courseEnrollments ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    progress_percent: Number(row.progress_percent) || 0,
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at ?? null,
    course_title: row.courses?.title ?? "Technical course",
    course_slug: row.courses?.slug ?? null,
  }))

  return {
    enrollments,
    activeCourses: enrollments.filter((item) => item.status === "active").length,
    startupApplications: startups?.length ?? 0,
    serviceRequests: consultations?.length ?? 0,
  }
}