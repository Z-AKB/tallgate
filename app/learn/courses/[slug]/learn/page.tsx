import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/database/server"
import { getLessonContent, type LessonAccessResult } from "@/lib/learning/getLessonContent"
import { coursesData } from "@/lib/data/courses"
import {
  HiOutlineArrowLeft,
  HiOutlineLockClosed,
  HiOutlinePlay,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineAcademicCap,
} from "react-icons/hi"

interface LessonPlayerPageProps {
  params: {
    slug: string
  }
  searchParams?: {
    lessonId?: string
    lesson?: string
  }
}

interface ModuleWithLessons {
  id: string
  title: string
  sort_order: number
  lessons: Array<{
    id: string
    title: string
    content_type: "video" | "text"
    duration_seconds: number | null
    duration_minutes?: number
    sort_order: number
    is_preview: boolean
  }>
}

function formatDuration(seconds?: number | null, minutes?: number) {
  if (typeof seconds === "number" && seconds > 0) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim()
  }
  if (typeof minutes === "number" && minutes > 0) {
    return `${minutes} min`
  }
  return "5 min"
}

export default async function LessonPlayerPage({
  params,
  searchParams,
}: LessonPlayerPageProps) {
  const supabase = await createClient()

  // 1. Fetch course details from database
  const { data: dbCourse } = await supabase
    .from("courses")
    .select("id, slug, title, overview, description")
    .eq("slug", params.slug)
    .maybeSingle()

  // Fallback to static catalogue data if DB course is not yet seeded
  const staticCourse = coursesData.find((c) => c.slug === params.slug)
  const courseTitle = dbCourse?.title || staticCourse?.title
  const courseOverview = dbCourse?.overview || dbCourse?.description || staticCourse?.overview

  if (!dbCourse && !staticCourse) {
    notFound()
  }

  // 2. Fetch modules & lessons hierarchy if dbCourse exists
  let modules: ModuleWithLessons[] = []

  if (dbCourse?.id) {
    const { data: dbModules } = await supabase
      .from("modules")
      .select(`
        id,
        title,
        sort_order,
        lessons (
          id,
          title,
          content_type,
          duration_seconds,
          sort_order,
          is_preview
        )
      `)
      .eq("course_id", dbCourse.id)
      .order("sort_order", { ascending: true })

    if (dbModules && dbModules.length > 0) {
      modules = (dbModules as unknown as ModuleWithLessons[]).map((mod) => ({
        ...mod,
        lessons: (mod.lessons || []).sort((a, b) => a.sort_order - b.sort_order),
      }))
    }
  }

  // Fallback structure if modules are not in DB yet
  if (modules.length === 0 && staticCourse?.syllabus) {
    modules = staticCourse.syllabus.map((mod, modIdx) => ({
      id: `mod-${modIdx + 1}`,
      title: mod.moduleTitle,
      sort_order: modIdx + 1,
      lessons: mod.topics.map((topic, topIdx) => ({
        id: `static-lesson-${modIdx + 1}-${topIdx + 1}`,
        title: topic,
        content_type: "video" as const,
        duration_seconds: 300,
        sort_order: topIdx + 1,
        is_preview: modIdx === 0 && topIdx === 0,
      })),
    }))
  }

  // Flatten all lessons across all modules
  const allLessons = modules.flatMap((m) => m.lessons)
  const requestedLessonId = searchParams?.lessonId || searchParams?.lesson

  // Determine active lesson
  const activeLesson =
    allLessons.find((l) => l.id === requestedLessonId) ||
    allLessons[0] ||
    null

  // 3. Perform access check via getLessonContent if active lesson exists
  let accessResult: LessonAccessResult | null = null

  if (activeLesson) {
    // If it's a real DB UUID, call getLessonContent directly
    if (activeLesson.id && !activeLesson.id.startsWith("static-")) {
      accessResult = await getLessonContent(activeLesson.id)
    } else {
      // For unseeded/static preview demo fallback:
      accessResult = activeLesson.is_preview
        ? {
            access: "granted",
            contentType: "video",
            signedUrl: "",
          }
        : { access: "denied" }
    }
  }

  const courseOverviewUrl = `/learning-hub/${params.slug}`

  return (
    <div className="site-shell min-h-screen text-slate-100 bg-[#09091a]">
      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href={courseOverviewUrl}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors flex-shrink-0"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Course</span>
            </Link>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">
                {courseTitle}
              </h1>
              {activeLesson && (
                <p className="text-xs text-slate-400 truncate">
                  {activeLesson.title}
                </p>
              )}
            </div>
          </div>

          <div>
            <Link
              href={courseOverviewUrl}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Course Overview
            </Link>
          </div>
        </div>
      </header>

      {/* Main Learning Hub Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main Content Area (Player / Text / Access Denied) */}
          <section className="lg:col-span-8 space-y-6">
            <div className="card-flat bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden p-0 shadow-2xl">
              {/* If no lesson exists */}
              {!activeLesson && (
                <div className="p-12 text-center space-y-4">
                  <HiOutlineExclamationCircle className="w-12 h-12 text-amber-400 mx-auto" />
                  <h2 className="text-lg font-bold text-white">No Lessons Available</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Course content is being prepared. Check back soon or return to the course overview.
                  </p>
                  <Link href={courseOverviewUrl} className="btn-primary inline-flex mt-4">
                    Back to Course Overview
                  </Link>
                </div>
              )}

              {/* ACCESS GRANTED: VIDEO */}
              {activeLesson && accessResult?.access === "granted" && accessResult.contentType === "video" && (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                    {accessResult.signedUrl ? (
                      <video
                        key={accessResult.signedUrl}
                        controls
                        controlsList="nodownload"
                        playsInline
                        className="w-full h-full object-contain"
                        src={accessResult.signedUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="text-center p-8 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                          <HiOutlinePlay className="w-8 h-8 ml-1" />
                        </div>
                        <p className="text-sm font-medium text-slate-300">
                          Preview Video Lesson
                        </p>
                        <p className="text-xs text-slate-500">
                          Video stream will play when uploaded to the private storage bucket.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="badge-primary text-[11px]">Video Lesson</span>
                      {activeLesson.is_preview && (
                        <span className="badge-success text-[11px]">Free Preview</span>
                      )}
                      <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        {formatDuration(activeLesson.duration_seconds, activeLesson.duration_minutes)}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {activeLesson.title}
                    </h2>
                  </div>
                </div>
              )}

              {/* ACCESS GRANTED: TEXT */}
              {activeLesson && accessResult?.access === "granted" && accessResult.contentType === "text" && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                    <span className="badge-neutral text-[11px]">Reading Lesson</span>
                    {activeLesson.is_preview && (
                      <span className="badge-success text-[11px]">Free Preview</span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      {formatDuration(activeLesson.duration_seconds, activeLesson.duration_minutes)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {activeLesson.title}
                  </h2>

                  <div className="prose prose-invert max-w-none text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {accessResult.body || (
                      <p className="text-slate-400 italic">No text content available for this lesson.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ACCESS DENIED: ENROLL TO ACCESS */}
              {activeLesson && accessResult?.access === "denied" && (
                <div className="p-8 sm:p-12 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                    <HiOutlineLockClosed className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-1">
                      Enrollment Required
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Enroll to Access This Lesson
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      &ldquo;{activeLesson.title}&rdquo; is restricted to enrolled learners. Enroll in the course to unlock full HD video streaming, curriculum exercises, and certificate tracking.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href={courseOverviewUrl}
                      className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
                    >
                      Enroll in Course
                    </Link>
                    <Link
                      href={courseOverviewUrl}
                      className="btn-secondary w-full sm:w-auto px-6 py-2.5 text-sm"
                    >
                      View Course Details
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Course Information Banner */}
            <div className="card-flat bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <HiOutlineAcademicCap className="w-4 h-4" />
                <span>About this Course</span>
              </div>
              <h3 className="text-lg font-bold text-white">{courseTitle}</h3>
              {courseOverview && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {courseOverview}
                </p>
              )}
            </div>
          </section>

          {/* Curriculum Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="card-flat bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Course Content
                </h3>
                <span className="text-xs text-slate-400">
                  {allLessons.length} {allLessons.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                {modules.map((mod, modIdx) => (
                  <div key={mod.id || modIdx} className="space-y-2">
                    <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                      Module {modIdx + 1}: {mod.title}
                    </h4>

                    <div className="space-y-1">
                      {mod.lessons.map((lesson) => {
                        const isActive = activeLesson?.id === lesson.id
                        const isVideo = lesson.content_type === "video"

                        return (
                          <Link
                            key={lesson.id}
                            href={`/learn/courses/${params.slug}/learn?lessonId=${lesson.id}`}
                            className={`group flex items-start gap-3 p-2.5 rounded-xl text-xs transition-all ${
                              isActive
                                ? "bg-indigo-600/20 border border-indigo-500/40 text-white font-medium"
                                : "text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent"
                            }`}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {lesson.is_preview ? (
                                isVideo ? (
                                  <HiOutlinePlay className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <HiOutlineDocumentText className="w-4 h-4 text-emerald-400" />
                                )
                              ) : isVideo ? (
                                <HiOutlinePlay className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                              ) : (
                                <HiOutlineDocumentText className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="truncate">{lesson.title}</span>
                                {lesson.is_preview && (
                                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">
                                    Preview
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {formatDuration(lesson.duration_seconds, lesson.duration_minutes)}
                              </span>
                            </div>

                            {!lesson.is_preview && (
                              <div className="flex-shrink-0 mt-0.5 text-slate-500">
                                <HiOutlineLockClosed className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
