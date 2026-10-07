"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getErrorMessage } from "@/lib/utils"
import type { Database } from "@/types/supabase"

type LiveSession = Database["public"]["Tables"]["live_sessions"]["Row"]
type Course = { id: string; title: string }
type Lesson = {
  id: string
  module_id: string
  title: string
  content_type: "video" | "text" | "document"
  is_preview: boolean
  content_url: string | null
  course_id: string
}
type SessionView = LiveSession & {
  course_title: string
  recording_title: string | null
}
type CourseContentAdminClientProps = {
  courses: Course[]
  lessons: Lesson[]
  sessions: SessionView[]
}

const POWERPOINT_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"

function localDateTimeValue(dateString?: string) {
  if (!dateString) return ""
  const date = new Date(dateString)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function formatUtcDate(dateString: string) {
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(dateString))} UTC`
}

export default function CourseContentAdminClient({
  courses,
  lessons: initialLessons,
  sessions: initialSessions,
}: CourseContentAdminClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [lessons, setLessons] = useState(initialLessons)
  const [sessions, setSessions] = useState(initialSessions)
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "")
  const [lessonId, setLessonId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionView | null>(null)
  const [sessionForm, setSessionForm] = useState({
    course_id: courses[0]?.id ?? "",
    title: "",
    scheduled_at: "",
    join_url: "",
    recording_lesson_id: "",
  })
  const [isSavingSession, setIsSavingSession] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const lessonsInCourse = lessons.filter((lesson) => lesson.course_id === courseId)
  const recordingLessons = lessons.filter(
    (lesson) => lesson.course_id === sessionForm.course_id && lesson.content_type === "video"
  )

  const resetSessionForm = () => {
    setEditingSession(null)
    setSessionForm({
      course_id: courses[0]?.id ?? "",
      title: "",
      scheduled_at: "",
      join_url: "",
      recording_lesson_id: "",
    })
  }

  const handleDocumentUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")

    const lesson = lessons.find((item) => item.id === lessonId)
    if (!lesson || !file) {
      setError("Select a lesson and a PDF or PPTX file.")
      return
    }

    const extension = file.name.split(".").pop()?.toLowerCase()
    const contentType =
      extension === "pdf"
        ? "application/pdf"
        : extension === "pptx"
          ? POWERPOINT_MIME
          : null
    if (!contentType) {
      setError("Only PDF and PPTX files are supported.")
      return
    }

    setIsUploading(true)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const objectPath = `${lesson.course_id}/${lesson.id}/${crypto.randomUUID()}-${safeName}`
    let uploaded = false
    let cleanupWarning = false

    try {
      const { data: previousContent, error: previousError } = await supabase
        .from("lesson_content")
        .select("content_url, content_body")
        .eq("lesson_id", lesson.id)
        .maybeSingle()
      if (previousError) throw previousError

      const { error: uploadError } = await supabase.storage
        .from("course-content")
        .upload(objectPath, file, { contentType, upsert: false })
      if (uploadError) throw uploadError
      uploaded = true

      const { error: contentError } = await supabase
        .from("lesson_content")
        .upsert(
          { lesson_id: lesson.id, content_url: objectPath, content_body: null },
          { onConflict: "lesson_id" }
        )
      if (contentError) throw contentError

      const { error: lessonError } = await supabase
        .from("lessons")
        .update({ content_type: "document" })
        .eq("id", lesson.id)
      if (lessonError) {
        const restoreResult = previousContent
          ? await supabase
              .from("lesson_content")
              .update(previousContent)
              .eq("lesson_id", lesson.id)
          : await supabase.from("lesson_content").delete().eq("lesson_id", lesson.id)
        if (restoreResult.error) {
          console.error("Unable to restore lesson content after type update failure:", restoreResult.error)
        }
        throw lessonError
      }

      if (previousContent?.content_url && previousContent.content_url !== objectPath) {
        const { error: cleanupError } = await supabase.storage
          .from("course-content")
          .remove([previousContent.content_url])
        if (cleanupError) {
          console.error("Previous course file could not be removed:", cleanupError)
          cleanupWarning = true
        }
      }

      setLessons((current) =>
        current.map((item) =>
          item.id === lesson.id
            ? { ...item, content_type: "document", content_url: objectPath }
            : item
        )
      )
      setFile(null)
      event.currentTarget.reset()
      setNotice(
        cleanupWarning
          ? "The new document is attached, but the previous storage file could not be removed."
          : "Course document uploaded and attached to the lesson."
      )
    } catch (uploadError: unknown) {
      console.error("Course document upload failed:", uploadError)
      if (uploaded) {
        const { error: cleanupError } = await supabase.storage
          .from("course-content")
          .remove([objectPath])
        if (cleanupError) console.error("Uploaded course file could not be removed:", cleanupError)
      }
      setError(getErrorMessage(uploadError, "Course document could not be uploaded."))
    } finally {
      setIsUploading(false)
    }
  }

  const startEditingSession = (session: SessionView) => {
    setEditingSession(session)
    setSessionForm({
      course_id: session.course_id,
      title: session.title,
      scheduled_at: localDateTimeValue(session.scheduled_at),
      join_url: session.join_url,
      recording_lesson_id: session.recording_lesson_id ?? "",
    })
    setError("")
    setNotice("")
  }

  const handleSessionSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setNotice("")
    if (!sessionForm.course_id || !sessionForm.title.trim() || !sessionForm.scheduled_at) {
      setError("Select a course and provide the session title and time.")
      return
    }

    let joinUrl: URL
    try {
      joinUrl = new URL(sessionForm.join_url)
    } catch {
      setError("Enter a valid HTTPS meeting link.")
      return
    }
    if (joinUrl.protocol !== "https:") {
      setError("Meeting links must use HTTPS.")
      return
    }

    const scheduledAt = new Date(sessionForm.scheduled_at)
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("Choose a valid class date and time.")
      return
    }

    setIsSavingSession(true)
    try {
      const payload: Database["public"]["Tables"]["live_sessions"]["Insert"] = {
        ...(editingSession ? { id: editingSession.id } : {}),
        course_id: sessionForm.course_id,
        title: sessionForm.title.trim(),
        scheduled_at: scheduledAt.toISOString(),
        join_url: joinUrl.toString(),
        recording_lesson_id: sessionForm.recording_lesson_id || null,
        updated_at: new Date().toISOString(),
      }
      const { data, error: saveError } = await supabase
        .from("live_sessions")
        .upsert(payload)
        .select("*")
        .single()
      if (saveError) throw saveError

      const saved: SessionView = {
        ...data,
        course_title: courses.find((course) => course.id === data.course_id)?.title ?? "Course",
        recording_title: lessons.find((item) => item.id === data.recording_lesson_id)?.title ?? null,
      }
      setSessions((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ].sort((left, right) =>
        left.scheduled_at.localeCompare(right.scheduled_at)
      ))
      resetSessionForm()
      setNotice("Live class saved.")
    } catch (saveError: unknown) {
      console.error("Live class save failed:", saveError)
      setError(getErrorMessage(saveError, "Live class could not be saved."))
    } finally {
      setIsSavingSession(false)
    }
  }

  return (
    <div className="space-y-8">
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || notice}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Upload a lesson document</h2>
        <p className="mt-1 text-xs text-slate-600">
          PDF and PowerPoint files are stored privately and exposed to enrolled learners through a temporary download link.
        </p>
        <form onSubmit={handleDocumentUpload} className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-xs font-semibold text-slate-700">
            Course
            <select
              required
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value)
                setLessonId("")
              }}
              className="form-input mt-1"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Existing lesson
            <select
              required
              value={lessonId}
              onChange={(event) => setLessonId(event.target.value)}
              className="form-input mt-1"
            >
              <option value="">Select lesson</option>
              {lessonsInCourse.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}{lesson.content_url ? " (replace attached file)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            PDF or PPTX
            <input
              required
              type="file"
              accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="form-input mt-1 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold"
            />
          </label>
          <button
            type="submit"
            disabled={isUploading || courses.length === 0 || lessonsInCourse.length === 0}
            className="btn-primary text-xs disabled:opacity-50 md:col-span-3 md:justify-self-end"
          >
            {isUploading ? "Uploading..." : "Upload and attach"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingSession ? "Edit live class" : "Schedule a live class"}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Meeting links open an external service. Times are entered in your local timezone and shown to learners in UTC.
            </p>
          </div>
          {editingSession && (
            <button type="button" onClick={resetSessionForm} className="text-xs font-semibold text-slate-600 underline">
              Cancel editing
            </button>
          )}
        </div>
        <form onSubmit={handleSessionSave} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700">
            Course
            <select
              required
              value={sessionForm.course_id}
              onChange={(event) => setSessionForm((form) => ({
                ...form,
                course_id: event.target.value,
                recording_lesson_id: "",
              }))}
              className="form-input mt-1"
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Session title
            <input
              required
              maxLength={160}
              value={sessionForm.title}
              onChange={(event) => setSessionForm((form) => ({ ...form, title: event.target.value }))}
              className="form-input mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Scheduled date and time
            <input
              required
              type="datetime-local"
              value={sessionForm.scheduled_at}
              onChange={(event) => setSessionForm((form) => ({ ...form, scheduled_at: event.target.value }))}
              className="form-input mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            HTTPS meeting link
            <input
              required
              type="url"
              placeholder="https://..."
              value={sessionForm.join_url}
              onChange={(event) => setSessionForm((form) => ({ ...form, join_url: event.target.value }))}
              className="form-input mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">
            Recording lesson (optional)
            <select
              value={sessionForm.recording_lesson_id}
              onChange={(event) => setSessionForm((form) => ({ ...form, recording_lesson_id: event.target.value }))}
              className="form-input mt-1"
            >
              <option value="">No recording attached</option>
              {recordingLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
              ))}
            </select>
            <span className="mt-1 block font-normal text-slate-500">
              Only video lessons in the selected course can be attached.
            </span>
          </label>
          <button
            type="submit"
            disabled={isSavingSession || courses.length === 0}
            className="btn-primary text-xs disabled:opacity-50 md:col-span-2 md:justify-self-end"
          >
            {isSavingSession ? "Saving..." : editingSession ? "Save class changes" : "Schedule class"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">Scheduled and past classes</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No live classes have been scheduled.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {sessions.map((session) => (
              <article key={session.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{session.title}</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {session.course_title} · {formatUtcDate(session.scheduled_at)}
                  </p>
                  {session.recording_title && (
                    <p className="mt-1 text-xs text-emerald-700">Recording: {session.recording_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={session.join_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-700 underline"
                  >
                    Meeting link
                  </a>
                  <button
                    type="button"
                    onClick={() => startEditingSession(session)}
                    className="text-xs font-semibold text-slate-700 underline"
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
