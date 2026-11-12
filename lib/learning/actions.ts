"use server"

import "server-only"

import { requireUser } from "@/lib/auth/guards"
import { createClient } from "@/lib/supabase/server"
import { checkCourseCompletion } from "@/lib/assessments/completion"
import type { CompletionResult } from "@/lib/assessments/completion"
import { getLessonContent } from "@/lib/learning/getLessonContent"
import { logError } from "@/lib/logging/logger"

export type LessonProgressResult =
  | {
      ok: true
      completed: boolean
      courseCompleted: boolean
      certificateIssued: boolean
      certificateStatus: CompletionResult["certificateStatus"]
    }
  | { ok: false; error: string }

function failure(error: string): LessonProgressResult {
  return { ok: false, error }
}

export async function completeLesson(lessonId: string): Promise<LessonProgressResult> {
  const user = await requireUser()

  const supabase = await createClient()

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("module_id, course_modules(course_id)")
    .eq("id", lessonId)
    .maybeSingle()

  if (lessonError) {
    logError("lesson_progress.lesson_lookup_failed", lessonError, { lessonId })
    return failure("The lesson could not be updated.")
  }
  const courseId = lesson?.course_modules?.course_id
  if (!lesson || !courseId) {
    return failure("The lesson could not be found.")
  }

  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle()

  if (!enrollment) {
    return failure("You are not enrolled in this course.")
  }

  // Completing a lesson is a privileged write: verify the same access rules
  // that gate the lesson player before recording progress. This prevents a
  // direct server-action call for a lesson the learner cannot open.
  let access
  try {
    access = await getLessonContent(lessonId)
  } catch (error) {
    logError("lesson_progress.access_check_failed", error, { lessonId })
    return failure("The lesson could not be updated.")
  }
  if (access.access !== "granted") {
    return failure("You do not have access to this lesson.")
  }

  const { error: progressError } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  )

  if (progressError) {
    logError("lesson_progress.upsert_failed", progressError, { lessonId })
    return failure("Your progress could not be saved.")
  }

  let courseCompleted = false
  let certificateIssued = false
  let certificateStatus: CompletionResult["certificateStatus"] = "none"
  try {
    const completion = await checkCourseCompletion(user.id, courseId)
    courseCompleted = completion.isComplete
    certificateIssued = completion.certificateIssued
    certificateStatus = completion.certificateStatus
  } catch (error) {
    logError("lesson_progress.completion_failed", error, { courseId })
  }

  return {
    ok: true,
    completed: true,
    courseCompleted,
    certificateIssued,
    certificateStatus,
  }
}

export async function saveLessonWatchProgress(
  lessonId: string,
  watchTimeSeconds: number
): Promise<LessonProgressResult> {
  const user = await requireUser()

  if (!Number.isFinite(watchTimeSeconds) || watchTimeSeconds < 0 || watchTimeSeconds > 86400) {
    return failure("Invalid watch duration.")
  }

  const supabase = await createClient()

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("module_id, course_modules(course_id)")
    .eq("id", lessonId)
    .maybeSingle()

  if (lessonError) {
    logError("lesson_progress.lesson_lookup_failed", lessonError, { lessonId })
    return failure("The lesson could not be updated.")
  }
  const courseId = lesson?.course_modules?.course_id
  if (!lesson || !courseId) {
    return failure("The lesson could not be found.")
  }

  // Watch progress is still persisted through RLS, but require an active
  // enrollment explicitly so an unenrolled session cannot write progress.
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .in("status", ["active", "completed"])
    .maybeSingle()

  if (!enrollment) {
    return failure("You are not enrolled in this course.")
  }

  // Watch time never marks a lesson complete; completion is an explicit
  // learner action so no invented viewing threshold can grant a certificate.
  const { error: progressError } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      watch_time_seconds: Math.round(watchTimeSeconds),
      last_watched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  )

  if (progressError) {
    logError("lesson_progress.watch_upsert_failed", progressError, { lessonId })
    return failure("Your progress could not be saved.")
  }

  return {
    ok: true,
    completed: false,
    courseCompleted: false,
    certificateIssued: false,
    certificateStatus: "none",
  }
}