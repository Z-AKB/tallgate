import { createClient } from "@/lib/supabase/server"
import type { CurrentUser } from "@/lib/auth/guards"

export type PortalEnrollment = {
  id: string
  course_id: string
  status: string
  progress_percent: number
  enrolled_at: string
  completed_at: string | null
  course_title: string
  course_slug: string | null
}

export type PortalCourseMaterial = {
  lesson_id: string
  lesson_title: string
  course_id: string
  course_title: string
  course_slug: string
  download_url: string
  file_name: string
}

export type PortalLiveSession = {
  id: string
  course_id: string
  course_title: string
  course_slug: string
  title: string
  scheduled_at: string
  join_url: string
  recording_lesson_id: string | null
  recording_title: string | null
}

export type PortalOverview = {
  enrollments: PortalEnrollment[]
  courseMaterials: PortalCourseMaterial[]
  liveSessions: PortalLiveSession[]
  upcomingSessions: PortalLiveSession[]
  recordedPastSessions: PortalLiveSession[]
  learningResourcesWarning: string
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
        .select("id, course_id, status, progress_percent, enrolled_at, completed_at, courses(title, slug)")
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
    course_id: row.course_id,
    status: row.status,
    progress_percent: Number(row.progress_percent) || 0,
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at ?? null,
    course_title: row.courses?.title ?? "Technical course",
    course_slug: row.courses?.slug ?? null,
  }))

  const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)))
  let courseMaterials: PortalCourseMaterial[] = []
  let liveSessions: PortalLiveSession[] = []
  let learningResourcesWarning = ""

  if (courseIds.length > 0) {
    const [modulesResult, sessionsResult] = await Promise.all([
      supabase.from("course_modules").select("id, course_id").in("course_id", courseIds),
      supabase
        .from("live_sessions")
        .select("id, course_id, title, scheduled_at, join_url, recording_lesson_id")
        .in("course_id", courseIds)
        .order("scheduled_at", { ascending: true }),
    ])

    if (modulesResult.error) {
      console.error("Unable to load enrolled course modules:", modulesResult.error)
      learningResourcesWarning = "Some course materials could not be loaded."
    }
    if (sessionsResult.error) {
      console.error("Unable to load enrolled course live sessions:", sessionsResult.error)
      learningResourcesWarning = "Some live class details could not be loaded."
    }

    const modules = modulesResult.data ?? []
    const moduleCourseIds = new Map(modules.map((module) => [module.id, module.course_id]))
    const moduleIds = modules.map((module) => module.id)
    const [lessonsResult, recordingLessonsResult] = await Promise.all([
      moduleIds.length > 0
        ? supabase
            .from("lessons")
            .select("id, module_id, title")
            .eq("content_type", "document")
            .in("module_id", moduleIds)
        : Promise.resolve({ data: [], error: null }),
      (sessionsResult.data ?? []).some((session) => session.recording_lesson_id)
        ? supabase
            .from("lessons")
            .select("id, title")
            .in(
              "id",
              (sessionsResult.data ?? [])
                .map((session) => session.recording_lesson_id)
                .filter((id): id is string => Boolean(id))
            )
        : Promise.resolve({ data: [], error: null }),
    ])

    if (lessonsResult.error) {
      console.error("Unable to load enrolled course document lessons:", lessonsResult.error)
      learningResourcesWarning = "Some course materials could not be loaded."
    }
    if (recordingLessonsResult.error) {
      console.error("Unable to load class recording lessons:", recordingLessonsResult.error)
      learningResourcesWarning = "Some class recordings could not be loaded."
    }

    const lessons = lessonsResult.data ?? []
    const lessonTitles = new Map(
      (recordingLessonsResult.data ?? []).map((lesson) => [lesson.id, lesson.title])
    )
    const lessonCourseIds = new Map(
      lessons.map((lesson) => [lesson.id, moduleCourseIds.get(lesson.module_id) ?? ""])
    )
    const courseById = new Map(enrollments.map((enrollment) => [
      enrollment.course_id,
      { title: enrollment.course_title, slug: enrollment.course_slug },
    ]))
    const lessonIds = lessons.map((lesson) => lesson.id)

    if (lessonIds.length > 0) {
      const { data: contentRows, error: contentError } = await supabase
        .from("lesson_content")
        .select("lesson_id, content_url")
        .in("lesson_id", lessonIds)

      if (contentError) {
        console.error("Unable to load enrolled lesson documents:", contentError)
        learningResourcesWarning = "Some course materials could not be loaded."
      } else {
        const signedMaterials = await Promise.all(
          (contentRows ?? []).map(async (content) => {
            const courseId = lessonCourseIds.get(content.lesson_id)
            const course = courseId ? courseById.get(courseId) : null
            const lesson = lessons.find((item) => item.id === content.lesson_id)
            if (!content.content_url || !courseId || !course?.slug || !lesson) return null

            const { data: signed, error } = await supabase.storage
              .from("course-content")
              .createSignedUrl(content.content_url, 60 * 60, { download: true })
            if (error || !signed) {
              console.error(`Unable to sign course document ${content.lesson_id}:`, error)
              learningResourcesWarning = "Some course materials could not be loaded."
              return null
            }

            return {
              lesson_id: content.lesson_id,
              lesson_title: lesson.title,
              course_id: courseId,
              course_title: course.title,
              course_slug: course.slug,
              download_url: signed.signedUrl,
              file_name: content.content_url.split("/").at(-1) || "course-material",
            }
          })
        )
        courseMaterials = signedMaterials.filter(
          (material): material is PortalCourseMaterial => material !== null
        )
      }
    }

    liveSessions = (sessionsResult.data ?? []).flatMap((session) => {
      const course = courseById.get(session.course_id)
      if (!course?.slug) return []
      return [{
        ...session,
        course_title: course.title,
        course_slug: course.slug,
        recording_title: session.recording_lesson_id
          ? lessonTitles.get(session.recording_lesson_id) ?? null
          : null,
      }]
    })
  }

  const currentTime = Date.now()
  const upcomingSessions = liveSessions.filter(
    (session) => new Date(session.scheduled_at).getTime() >= currentTime
  )
  const recordedPastSessions = liveSessions.filter(
    (session) =>
      new Date(session.scheduled_at).getTime() < currentTime &&
      Boolean(session.recording_lesson_id)
  )

  return {
    enrollments,
    courseMaterials,
    liveSessions,
    upcomingSessions,
    recordedPastSessions,
    learningResourcesWarning,
    activeCourses: enrollments.filter((item) => item.status === "active").length,
    startupApplications: startups?.length ?? 0,
    serviceRequests: consultations?.length ?? 0,
  }
}