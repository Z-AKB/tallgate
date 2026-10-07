import CourseContentAdminClient from "@/components/admin/CourseContentAdminClient"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

export const metadata = {
  title: "Course Materials & Live Classes | TallGate Admin",
}

export default async function AdminCourseContentPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Course Materials & Live Classes</h1>
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Course content is unavailable because Supabase is not configured.
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const [coursesResult, modulesResult, lessonsResult, contentResult, sessionsResult] =
    await Promise.all([
      supabase.from("courses").select("id, title").order("title"),
      supabase.from("course_modules").select("id, course_id, title").order("order_index"),
      supabase
        .from("lessons")
        .select("id, module_id, title, content_type, is_preview")
        .order("order_index"),
      supabase.from("lesson_content").select("lesson_id, content_url"),
      supabase
        .from("live_sessions")
        .select("*")
        .order("scheduled_at", { ascending: true }),
    ])

  const failures = [
    coursesResult.error && "courses",
    modulesResult.error && "course modules",
    lessonsResult.error && "lessons",
    contentResult.error && "lesson content",
    sessionsResult.error && "live sessions",
  ].filter(Boolean)

  for (const [name, error] of [
    ["courses", coursesResult.error],
    ["course modules", modulesResult.error],
    ["lessons", lessonsResult.error],
    ["lesson content", contentResult.error],
    ["live sessions", sessionsResult.error],
  ] as const) {
    if (error) console.error(`Course content admin page could not load ${name}:`, error)
  }

  const moduleCourses = new Map((modulesResult.data ?? []).map((module) => [module.id, module.course_id]))
  const lessonTitles = new Map((lessonsResult.data ?? []).map((lesson) => [lesson.id, lesson.title]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Course Materials & Live Classes</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload PDF/PPTX lesson handouts and schedule classes with external meeting links.
        </p>
      </div>
      {failures.length > 0 && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Some course content could not be loaded ({failures.join(", ")}). Check migration status and admin database access.
        </p>
      )}
      <CourseContentAdminClient
        courses={coursesResult.data ?? []}
        lessons={(lessonsResult.data ?? []).map((lesson) => ({
          id: lesson.id,
          module_id: lesson.module_id,
          title: lesson.title,
          content_type: lesson.content_type,
          is_preview: lesson.is_preview,
          content_url: (contentResult.data ?? []).find((content) => content.lesson_id === lesson.id)?.content_url ?? null,
          course_id: moduleCourses.get(lesson.module_id) ?? "",
        }))}
        sessions={(sessionsResult.data ?? []).map((session) => ({
          ...session,
          course_title: (coursesResult.data ?? []).find((course) => course.id === session.course_id)?.title ?? "Course",
          recording_title: session.recording_lesson_id
            ? lessonTitles.get(session.recording_lesson_id) ?? null
            : null,
        }))}
      />
    </div>
  )
}
