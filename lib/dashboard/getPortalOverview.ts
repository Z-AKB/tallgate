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
  category: string
  level: string
  duration: string | null
  nextLessonId: string | null
  nextLessonTitle: string | null
  lastActivityAt: string
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

export type PortalCertificate = {
  id: string
  course_title: string
  issue_date: string
  verification_code: string
  grade: string | null
  is_valid: boolean
  hasDocument: boolean
}

export type ExploreCourse = {
  id: string
  slug: string
  title: string
  category: string
  level: string
  duration: string | null
}

export type PortalOverview = {
  enrollments: PortalEnrollment[]
  liveSessions: PortalLiveSession[]
  upcomingSessions: PortalLiveSession[]
  recordedPastSessions: PortalLiveSession[]
  learningResourcesWarning: string
  activeCourses: number
  certificates: PortalCertificate[]
  exploreCourses: ExploreCourse[]
}

export async function getPortalOverview(user: CurrentUser): Promise<PortalOverview> {
  const supabase = await createClient()

  const [{ data: courseEnrollments }, { data: certificateRows }, { data: exploreRows, error: exploreError }] =
    await Promise.all([
      supabase
        .from("course_enrollments")
        .select("id, course_id, status, progress_percent, enrolled_at, completed_at, courses(title, slug, category, level, duration)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false }),
      supabase
        .from("certificates")
        .select("id, course_title, issue_date, verification_code, grade, is_valid, storage_path")
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false }),
      (async () => {
        const { data: rows } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("user_id", user.id)
        const enrolledCourseIds = Array.from(new Set((rows ?? []).map((row) => row.course_id))).filter(
          (id): id is string => Boolean(id)
        )
        let query = supabase
          .from("courses")
          .select("id, slug, title, category, level, duration")
          .eq("is_published", true)
          .order("display_order", { ascending: true })
          .limit(6)
        if (enrolledCourseIds.length > 0) {
          query = query.not("id", "in", `(${enrolledCourseIds.join(",")})`)
        }
        return query
      })(),
    ])

  if (exploreError) {
    console.error("Unable to load courses for exploration:", exploreError)
  }

  const enrollments: PortalEnrollment[] = (courseEnrollments ?? []).map((row) => ({
    id: row.id,
    course_id: row.course_id,
    status: row.status,
    progress_percent: Number(row.progress_percent) || 0,
    enrolled_at: row.enrolled_at,
    completed_at: row.completed_at ?? null,
    course_title: row.courses?.title ?? "Technical course",
    course_slug: row.courses?.slug ?? null,
    category: row.courses?.category ?? "",
    level: row.courses?.level ?? "",
    duration: row.courses?.duration ?? null,
    nextLessonId: null,
    nextLessonTitle: null,
    lastActivityAt: row.enrolled_at,
  }))

  const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)))
  let liveSessions: PortalLiveSession[] = []
  let learningResourcesWarning = ""
  const lessonTitleById = new Map<string, string>()

  if (courseIds.length > 0) {
    const [modulesResult, sessionsResult] = await Promise.all([
      supabase
        .from("course_modules")
        .select("id, course_id, order_index")
        .in("course_id", courseIds),
      supabase
        .from("live_sessions")
        .select("id, course_id, title, scheduled_at, join_url, recording_lesson_id")
        .in("course_id", courseIds)
        .order("scheduled_at", { ascending: true }),
    ])

    if (modulesResult.error) {
      console.error("Unable to load enrolled course modules:", modulesResult.error)
      learningResourcesWarning = "Some course details could not be loaded."
    }
    if (sessionsResult.error) {
      console.error("Unable to load enrolled course live sessions:", sessionsResult.error)
      learningResourcesWarning = "Some live class details could not be loaded."
    }

    const modules = modulesResult.data ?? []
    const moduleIds = modules.map((module) => module.id)
    let lessonIds: string[] = []

    if (moduleIds.length > 0) {
      const { data: lessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id, module_id, title, order_index")
        .in("module_id", moduleIds)

      if (lessonsError) {
        console.error("Unable to load enrolled course lessons:", lessonsError)
        learningResourcesWarning = "Some course details could not be loaded."
      } else {
        const moduleByCourse = new Map(modules.map((mod) => [mod.id, mod.course_id]))
        const courseLessons = (lessons ?? []).map((lesson) => ({
          ...lesson,
          course_id: moduleByCourse.get(lesson.module_id) ?? "",
        }))
        lessonIds = courseLessons.map((lesson) => lesson.id)
        for (const lesson of courseLessons) lessonTitleById.set(lesson.id, lesson.title)

        const orderedLessons = new Map<string, typeof courseLessons>()
        const orderedModules = [...modules].sort(
          (left, right) => Number(left.order_index) - Number(right.order_index)
        )
        for (const mod of orderedModules) {
          const inModule = courseLessons
            .filter((lesson) => lesson.module_id === mod.id)
            .sort((left, right) => Number(left.order_index) - Number(right.order_index))
          for (const lesson of inModule) {
            const courseList = orderedLessons.get(lesson.course_id) ?? []
            courseList.push(lesson)
            orderedLessons.set(lesson.course_id, courseList)
          }
        }

        const progressMap = new Map<string, { is_completed: boolean; last_watched_at: string | null }>()
        if (lessonIds.length > 0) {
          const { data: progressRows, error: progressError } = await supabase
            .from("lesson_progress")
            .select("lesson_id, is_completed, last_watched_at")
            .eq("user_id", user.id)
            .in("lesson_id", lessonIds)

          if (progressError) {
            console.error("Unable to load lesson progress:", progressError)
            learningResourcesWarning = "Some course progress details could not be loaded."
          } else {
            for (const row of progressRows ?? []) {
              progressMap.set(row.lesson_id, {
                is_completed: row.is_completed,
                last_watched_at: row.last_watched_at,
              })
            }
          }
        }

        for (const enrollment of enrollments) {
          const courseLessonsForEnrollment = orderedLessons.get(enrollment.course_id) ?? []
          const nextLesson = courseLessonsForEnrollment.find((lesson) => {
            const progress = progressMap.get(lesson.id)
            return !progress || !progress.is_completed
          })
          if (nextLesson) {
            enrollment.nextLessonId = nextLesson.id
            enrollment.nextLessonTitle = nextLesson.title
          }
          const lastWatch = courseLessonsForEnrollment.reduce((latest, lesson) => {
            const watchedAt = progressMap.get(lesson.id)?.last_watched_at
            if (!watchedAt) return latest
            return watchedAt > latest ? watchedAt : latest
          }, "")
          if (lastWatch) enrollment.lastActivityAt = lastWatch
        }
      }
    }

    const courseById = new Map(
      enrollments.map((enrollment) => [
        enrollment.course_id,
        { title: enrollment.course_title, slug: enrollment.course_slug },
      ])
    )
    liveSessions = (sessionsResult.data ?? []).flatMap((session) => {
      const course = courseById.get(session.course_id)
      if (!course?.slug) return []
      return [{
        ...session,
        course_title: course.title,
        course_slug: course.slug,
        recording_title: session.recording_lesson_id
          ? lessonTitleById.get(session.recording_lesson_id) ?? null
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
    liveSessions,
    upcomingSessions,
    recordedPastSessions,
    learningResourcesWarning,
    activeCourses: enrollments.filter((item) => item.status === "active").length,
    certificates: (certificateRows ?? []).map((row) => ({
      id: row.id,
      course_title: row.course_title,
      issue_date: row.issue_date,
      verification_code: row.verification_code,
      grade: row.grade ?? null,
      is_valid: row.is_valid,
      hasDocument: Boolean(row.storage_path),
    })),
    exploreCourses: (exploreRows ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category ?? "",
      level: row.level ?? "",
      duration: row.duration ?? null,
    })),
  }
}