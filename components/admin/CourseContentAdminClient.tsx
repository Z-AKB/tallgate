"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getErrorMessage } from "@/lib/utils"
import type { Database } from "@/types/supabase"
import {
  HiOutlineFolder,
  HiOutlineXMark,
} from "react-icons/hi2"

type LiveSession = Database["public"]["Tables"]["live_sessions"]["Row"]
type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"]

type Course = { id: string; title: string; category: string | null }
type Module = { id: string; course_id: string; title: string; order_index: number }
type Lesson = {
  id: string
  module_id: string
  title: string
  content_type: "video" | "text" | "document"
  is_preview: boolean
  order_index: number
  content_url: string | null
  course_id: string
}
type SessionView = LiveSession & {
  course_title: string
  recording_title: string | null
}

type FolderItem = {
  key: string
  file: File
  fileName: string
  fileSize: number
  lessonId: string | null
  lessonTitle: string
  createLesson: boolean
  status: "pending" | "uploading" | "uploaded" | "failed" | "skipped"
  message: string
}

type CourseContentAdminClientProps = {
  initialCourseId?: string
  courses: Course[]
  modules: Module[]
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

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileExtension(fileName: string) {
  return (fileName.split(".").pop() ?? "").toLowerCase()
}

function contentTypeFor(fileName: string) {
  const extension = fileExtension(fileName)
  if (extension === "pdf") return "application/pdf"
  if (extension === "pptx") return POWERPOINT_MIME
  return null
}

function relativePathOf(file: File) {
  const withPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
  return withPath && withPath.trim() ? withPath : file.name
}

function normalizeLabel(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function stripLeadingNumber(value: string) {
  return value.replace(/^\d+[\s._-]+/, "").trim()
}

function lessonTitleFromFile(relativePath: string) {
  const leaf = relativePath.split("/").filter(Boolean).pop() ?? "Material"
  const cleaned = stripLeadingNumber(normalizeLabel(leaf)).trim()
  if (!cleaned) return "Untitled material"
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function buildObjectPath(courseId: string, lessonId: string, relativePath: string) {
  const segments = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^A-Za-z0-9._-]/g, "_"))
  const leaf = (segments.at(-1) ?? "material").slice(-100)
  const parents = segments.slice(0, -1).slice(-2).map((segment) => segment.slice(0, 40))
  return `${courseId}/${lessonId}/${crypto.randomUUID()}-${[...parents, leaf].join("/")}`
}

function buildLessonLookup(lessonsInCourse: Lesson[]) {
  const lookup = new Map<string, Lesson[]>()
  for (const lesson of lessonsInCourse) {
    const labels = new Set<string>()
    const normalized = normalizeLabel(lesson.title)
    if (normalized) labels.add(normalized)
    const stripped = stripLeadingNumber(normalized)
    if (stripped) labels.add(stripped)
    for (const label of labels) {
      const bucket = lookup.get(label)
      if (bucket) bucket.push(lesson)
      else lookup.set(label, [lesson])
    }
  }
  return lookup
}

function matchLessonToFileName(fileName: string, lookup: Map<string, Lesson[]>) {
  const leaf = fileName.split("/").filter(Boolean).pop() ?? fileName
  const candidates = [
    normalizeLabel(leaf),
    normalizeLabel(fileName),
    stripLeadingNumber(normalizeLabel(leaf)),
    stripLeadingNumber(normalizeLabel(fileName)),
  ].filter(Boolean)

  const seen = new Set<string>()
  for (const candidate of candidates) {
    const matches = lookup.get(candidate)
    if (!matches || matches.length === 0) continue
    if (matches.length > 1) {
      return { lesson: null, reason: `The name matches ${matches.length} lessons in this course.` }
    }
    const lesson = matches[0]
    if (seen.has(lesson.id)) continue
    seen.add(lesson.id)
    return { lesson, reason: null }
  }
  return {
    lesson: null,
    reason: "No lesson in this course has a matching title.",
  }
}

function lessonStatus(lesson: Lesson) {
  if (lesson.content_type === "video") return "video"
  if (lesson.content_type === "document") {
    return lesson.content_url ? "document attached" : "document (file missing)"
  }
  return "text"
}

function findModule(modules: Module[], moduleId: string) {
  return modules.find((module) => module.id === moduleId)
}

function statusLabel(status: FolderItem["status"]) {
  switch (status) {
    case "pending":
      return "Ready"
    case "uploading":
      return "Uploading"
    case "uploaded":
      return "Uploaded"
    case "failed":
      return "Failed"
    default:
      return "Skipped"
  }
}

function statusClasses(status: FolderItem["status"]) {
  switch (status) {
    case "uploaded":
      return "rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700"
    case "failed":
      return "rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700"
    case "uploading":
      return "rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700"
    case "skipped":
      return "rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700"
    default:
      return "rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600"
  }
}

type AttachResult = { replacedFile: boolean; cleanupWarning: boolean }

export default function CourseContentAdminClient({
  initialCourseId,
  courses,
  modules,
  lessons: initialLessons,
  sessions: initialSessions,
}: CourseContentAdminClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [lessons, setLessons] = useState(initialLessons)
  const [sessions, setSessions] = useState(initialSessions)
  const resolvedCourseId =
    initialCourseId && courses.some((course) => course.id === initialCourseId)
      ? initialCourseId
      : courses[0]?.id ?? ""
  const [courseId, setCourseId] = useState(resolvedCourseId)
  const [lessonId, setLessonId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [folderItems, setFolderItems] = useState<FolderItem[]>([])
  const [createMissingLessons, setCreateMissingLessons] = useState(false)
  const [isUploadingFolder, setIsUploadingFolder] = useState(false)
  const [folderProgress, setFolderProgress] = useState({ done: 0, total: 0 })
  const [editingSession, setEditingSession] = useState<SessionView | null>(null)
  const [sessionForm, setSessionForm] = useState({
    course_id: resolvedCourseId,
    title: "",
    scheduled_at: "",
    join_url: "",
    recording_lesson_id: "",
  })
  const [isSavingSession, setIsSavingSession] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [courseSearch, setCourseSearch] = useState("")
  const [lessonSearch, setLessonSearch] = useState("")

  const lessonsInCourse = useMemo(
    () => lessons.filter((lesson) => lesson.course_id === courseId),
    [lessons, courseId]
  )
  const modulesInCourse = useMemo(
    () => modules.filter((module) => module.course_id === courseId),
    [modules, courseId]
  )

  const visibleCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase()
    const matched = query
      ? courses.filter(
          (course) =>
            course.title.toLowerCase().includes(query) ||
            (course.category ?? "").toLowerCase().includes(query)
        )
      : courses
    if (courseId && !matched.some((course) => course.id === courseId)) {
      const selected = courses.find((course) => course.id === courseId)
      return selected ? [selected, ...matched] : matched
    }
    return matched
  }, [courses, courseSearch, courseId])

  const lessonGroups = useMemo(() => {
    const query = lessonSearch.trim().toLowerCase()
    const moduleOrder = new Map(modulesInCourse.map((module, index) => [module.id, index]))
    const matched = lessonsInCourse.filter(
      (lesson) =>
        !query ||
        lesson.title.toLowerCase().includes(query) ||
        findModule(modules, lesson.module_id)?.title.toLowerCase().includes(query)
    )
    if (lessonId && !matched.some((lesson) => lesson.id === lessonId)) {
      const selected = lessons.find((lesson) => lesson.id === lessonId)
      if (selected) matched.push(selected)
    }
    const groups = new Map<string, Lesson[]>()
    for (const lesson of matched) {
      const bucket = groups.get(lesson.module_id)
      if (bucket) bucket.push(lesson)
      else groups.set(lesson.module_id, [lesson])
    }
    return Array.from(groups.entries())
      .sort(
        ([left], [right]) =>
          (moduleOrder.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (moduleOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
      )
      .map(([moduleId, groupLessons]) => ({
        moduleId,
        moduleTitle: findModule(modules, moduleId)?.title ?? "Lessons",
        lessons: [...groupLessons].sort((left, right) => left.order_index - right.order_index),
      }))
  }, [lessonsInCourse, lessonSearch, lessonId, modulesInCourse, lessons, modules])

  const recordingLessons = lessons.filter(
    (lesson) => lesson.course_id === sessionForm.course_id && lesson.content_type === "video"
  )
  const selectedCourse = courses.find((course) => course.id === courseId)
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId)
  const pendingFolderItems = folderItems.filter(
    (item) => item.status === "pending" || item.status === "uploading"
  )
  const uploadedFolderCount = folderItems.filter((item) => item.status === "uploaded").length
  const failedFolderCount = folderItems.filter((item) => item.status === "failed").length
  const skippedFolderCount = folderItems.filter((item) => item.status === "skipped").length

  useEffect(() => {
    const input = folderInputRef.current
    if (!input) return
    input.setAttribute("webkitdirectory", "")
    input.setAttribute("directory", "")
  }, [])

  const resetSessionForm = () => {
    setEditingSession(null)
    setSessionForm({
      course_id: courseId,
      title: "",
      scheduled_at: "",
      join_url: "",
      recording_lesson_id: "",
    })
  }

  const rememberLesson = (updated: Lesson) => {
    setLessons((current) => {
      const exists = current.some((lesson) => lesson.id === updated.id)
      return exists
        ? current.map((lesson) => (lesson.id === updated.id ? updated : lesson))
        : [...current, updated]
    })
  }

  const attachDocument = async (
    targetLesson: Pick<Lesson, "id" | "course_id">,
    selectedFile: File,
    objectPath: string
  ): Promise<AttachResult> => {
    const contentType = contentTypeFor(selectedFile.name)
    if (!contentType) throw new Error("Only PDF and PPTX files are supported.")

    const { data: previousContent, error: previousError } = await supabase
      .from("lesson_content")
      .select("content_url, content_body")
      .eq("lesson_id", targetLesson.id)
      .maybeSingle()
    if (previousError) throw previousError

    const { error: uploadError } = await supabase.storage
      .from("course-content")
      .upload(objectPath, selectedFile, { contentType, upsert: false })
    if (uploadError) throw uploadError

    try {
      const { error: contentError } = await supabase
        .from("lesson_content")
        .upsert(
          { lesson_id: targetLesson.id, content_url: objectPath, content_body: null },
          { onConflict: "lesson_id" }
        )
      if (contentError) throw contentError

      // RLS hides rows instead of raising errors, so a blocked update looks
      // like a success that changed nothing. Verify a row was written,
      // otherwise the lesson would keep serving its old content type while
      // lesson_content points at the new file.
      const { data: updatedLesson, error: lessonError } = await supabase
        .from("lessons")
        .update({ content_type: "document" })
        .eq("id", targetLesson.id)
        .select("id, module_id, title, content_type, is_preview, order_index")
        .maybeSingle()
      if (lessonError) throw lessonError
      if (!updatedLesson) {
        throw new Error(
          "The lesson content type was not updated because the update matched no rows. Check that the admin course/lesson update migration has been applied."
        )
      }

      let cleanupWarning = false
      if (previousContent?.content_url && previousContent.content_url !== objectPath) {
        const { error: cleanupError } = await supabase.storage
          .from("course-content")
          .remove([previousContent.content_url])
        if (cleanupError) {
          console.error("Previous course file could not be removed:", cleanupError)
          cleanupWarning = true
        }
      }

      rememberLesson({
        id: updatedLesson.id,
        module_id: updatedLesson.module_id,
        title: updatedLesson.title,
        content_type: updatedLesson.content_type,
        is_preview: updatedLesson.is_preview,
        order_index: updatedLesson.order_index,
        content_url: objectPath,
        course_id: targetLesson.course_id,
      })

      return { replacedFile: Boolean(previousContent?.content_url), cleanupWarning }
    } catch (attachError) {
      if (previousContent) {
        const restoreResult = await supabase
          .from("lesson_content")
          .update(previousContent)
          .eq("lesson_id", targetLesson.id)
        if (restoreResult.error) {
          console.error(
            "Unable to restore lesson content after attach failure:",
            restoreResult.error
          )
        }
      } else {
        await supabase.from("lesson_content").delete().eq("lesson_id", targetLesson.id)
      }
      const { error: cleanupError } = await supabase.storage
        .from("course-content")
        .remove([objectPath])
      if (cleanupError) console.error("Uploaded course file could not be removed:", cleanupError)
      throw attachError
    }
  }

  const handleDocumentUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    event.preventDefault()
    setError("")
    setNotice("")

    const lesson = lessons.find((item) => item.id === lessonId)
    if (!lesson || !file) {
      setError("Select a lesson and a PDF or PPTX file.")
      return
    }
    if (!contentTypeFor(file.name)) {
      setError("Only PDF and PPTX files are supported.")
      return
    }

    setIsUploading(true)
    try {
      const objectPath = buildObjectPath(lesson.course_id, lesson.id, file.name)
      const result = await attachDocument(lesson, file, objectPath)
      setFile(null)
      form.reset()
      setNotice(
        result.cleanupWarning
          ? "The new document is attached, but the previous storage file could not be removed."
          : result.replacedFile
            ? "The lesson document was replaced."
            : "Course document uploaded and attached to the lesson."
      )
    } catch (uploadError: unknown) {
      console.error("Course document upload failed:", uploadError)
      setError(getErrorMessage(uploadError, "Course document could not be uploaded."))
    } finally {
      setIsUploading(false)
    }
  }

  const planFolder = (selectedFiles: File[], createMissing: boolean) => {
    setError("")
    setNotice("")
    setFolderProgress({ done: 0, total: 0 })
    const lookup = buildLessonLookup(lessonsInCourse)

    const planned: FolderItem[] = selectedFiles.map((selectedFile, index) => {
      const fileName = relativePathOf(selectedFile)
      const base: FolderItem = {
        key: `${index}-${fileName}`,
        file: selectedFile,
        fileName,
        fileSize: selectedFile.size,
        lessonId: null,
        lessonTitle: "",
        createLesson: false,
        status: "pending",
        message: "",
      }

      if (!contentTypeFor(fileName)) {
        return {
          ...base,
          status: "skipped",
          message: "Only PDF and PPTX files are supported.",
        }
      }

      const matched = matchLessonToFileName(fileName, lookup)
      if (matched.lesson) {
        return {
          ...base,
          lessonId: matched.lesson.id,
          lessonTitle: matched.lesson.title,
          message: "Ready",
        }
      }

      if (createMissing) {
        if (modulesInCourse.length === 0) {
          return {
            ...base,
            status: "skipped",
            message: "This course has no module, so a new lesson cannot be created.",
          }
        }
        const title = lessonTitleFromFile(fileName)
        return { ...base, createLesson: true, lessonTitle: `${title} (new lesson)`, message: "Ready" }
      }

      return { ...base, status: "skipped", message: matched.reason ?? "No matching lesson." }
    })

    setFolderItems(planned)
    const ready = planned.filter((item) => item.status === "pending").length
    if (planned.length === 0) {
      setError("The selected folder contains no files.")
    } else if (ready === 0) {
      setError("None of the files in this folder can be attached to a lesson.")
    }
  }

  const createLessonForFile = async (fileName: string, orderIndex: number) => {
    const targetModule = modulesInCourse[0]
    if (!targetModule) throw new Error("This course has no module to hold a new lesson.")

    const insertData: LessonInsert = {
      module_id: targetModule.id,
      title: lessonTitleFromFile(fileName),
      content_type: "document",
      order_index: orderIndex,
      is_preview: false,
    }
    const { data: created, error: createError } = await supabase
      .from("lessons")
      .insert(insertData)
      .select("id, module_id, title, content_type, is_preview, order_index")
      .single()
    if (createError || !created) {
      throw new Error(createError?.message ?? "The lesson could not be created.")
    }
    return created
  }

  const uploadFolder = async () => {
    if (isUploadingFolder || folderItems.length === 0) return
    const targets = folderItems.filter((item) => item.status === "pending")
    if (targets.length === 0) {
      setError("There are no ready files to upload.")
      return
    }

    setError("")
    setNotice("")
    setIsUploadingFolder(true)
    setFolderProgress({ done: 0, total: targets.length })

    let done = 0
    let uploaded = 0
    let failed = 0
    const firstModule = modulesInCourse[0]
    let nextOrderIndex =
      firstModule === undefined
        ? 0
        : lessonsInCourse
            .filter((lesson) => lesson.module_id === firstModule.id)
            .reduce((max, lesson) => Math.max(max, lesson.order_index), -1) + 1

    for (const item of targets) {
      setFolderItems((current) =>
        current.map((entry) =>
          entry.key === item.key ? { ...entry, status: "uploading", message: "Uploading..." } : entry
        )
      )

      let createdLessonId: string | null = null
      try {
        let targetLessonId = item.lessonId
        const targetCourseId = courseId

        if (!targetLessonId && item.createLesson) {
          const created = await createLessonForFile(item.fileName, nextOrderIndex)
          nextOrderIndex += 1
          createdLessonId = created.id
          targetLessonId = created.id
        }
        if (!targetLessonId || !targetCourseId) {
          throw new Error("No target lesson could be resolved for this file.")
        }

        const objectPath = buildObjectPath(targetCourseId, targetLessonId, item.fileName)
        const result = await attachDocument(
          { id: targetLessonId, course_id: targetCourseId },
          item.file,
          objectPath
        )

        uploaded += 1
        setFolderItems((current) =>
          current.map((entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  status: "uploaded",
                  lessonId: targetLessonId,
                  message: result.cleanupWarning
                    ? "Uploaded, but the previous file could not be removed."
                    : result.replacedFile
                      ? "Uploaded; replaced the previous file."
                      : "Uploaded.",
                }
              : entry
          )
        )
      } catch (uploadError: unknown) {
        if (createdLessonId) {
          const { error: deleteError } = await supabase.from("lessons").delete().eq("id", createdLessonId)
          if (deleteError) console.error("Created lesson could not be rolled back:", deleteError)
        }
        failed += 1
        console.error(`Folder upload failed for ${item.fileName}:`, uploadError)
        setFolderItems((current) =>
          current.map((entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  status: "failed",
                  message: getErrorMessage(uploadError, "Upload failed."),
                }
              : entry
          )
        )
      } finally {
        done += 1
        setFolderProgress({ done, total: targets.length })
      }
    }

    setIsUploadingFolder(false)
    const skipped = folderItems.filter((item) => item.status === "skipped").length
    const summary = `Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}` +
      `${failed ? `, ${failed} failed` : ""}` +
      `${skipped ? `, ${skipped} skipped` : ""}.`
    setNotice(summary)
    if (failed > 0 || skipped > 0) {
      setError("")
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

  const progressPercent =
    folderProgress.total > 0
      ? Math.round((folderProgress.done / folderProgress.total) * 100)
      : 0

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
            <input
              type="search"
              placeholder="Search courses or domains..."
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
              className="form-input mt-1"
            />
            <select
              required
              value={courseId}
              onChange={(event) => {
                const nextCourseId = event.target.value
                setCourseId(nextCourseId)
                setLessonId("")
                setCourseSearch("")
                // Planned uploads are only valid for the course their lessons
                // belong to, so drop anything not yet uploaded.
                if (!isUploadingFolder) {
                  setFolderItems((current) =>
                    current.filter(
                      (item) => item.status !== "pending" && item.status !== "uploading"
                    )
                  )
                }
              }}
              className="form-input mt-1"
            >
              <option value="">Select course</option>
              {visibleCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                  {course.category ? ` — ${course.category}` : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block font-normal text-slate-500">
              {visibleCourses.length === courses.length
                ? `${courses.length} courses`
                : `${visibleCourses.length} of ${courses.length} courses`}
              {selectedCourse?.category ? ` · domain: ${selectedCourse.category}` : ""}
            </span>
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Existing lesson
            <input
              type="search"
              placeholder="Search lessons..."
              value={lessonSearch}
              onChange={(event) => setLessonSearch(event.target.value)}
              className="form-input mt-1"
            />
            <select
              required
              value={lessonId}
              onChange={(event) => setLessonId(event.target.value)}
              className="form-input mt-1"
            >
              <option value="">Select lesson</option>
              {lessonGroups.map((group) => (
                <optgroup key={group.moduleId} label={group.moduleTitle}>
                  {group.lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title} ({lessonStatus(lesson)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="mt-1 block font-normal text-slate-500">
              {selectedLesson
                ? `${lessonGroups.length} modules · selected lesson is ${lessonStatus(selectedLesson)}`
                : `${lessonGroups.length} modules · ${lessonsInCourse.length} lessons`}
            </span>
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
            <span className="mt-1 block font-normal text-slate-500">
              Replaces the file attached to the selected lesson.
            </span>
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
            <h2 className="text-lg font-bold text-slate-900">Upload a folder of materials</h2>
            <p className="mt-1 text-xs text-slate-600">
              Pick a folder from your computer. Every PDF and PPTX inside it is matched to a lesson in the selected
              course by file name, and files that cannot be matched are reported instead of attached to the wrong lesson.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={createMissingLessons}
              disabled={isUploadingFolder}
              onChange={(event) => {
                const enabled = event.target.checked
                setCreateMissingLessons(enabled)
                const reportStarted = folderItems.some(
                  (item) => item.status === "uploaded" || item.status === "uploading"
                )
                if (folderItems.length > 0 && !reportStarted) {
                  planFolder(
                    folderItems.map((item) => item.file),
                    enabled
                  )
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            Create a lesson for unmatched files
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? [])
              event.target.value = ""
              if (selected.length > 0) planFolder(selected, createMissingLessons)
            }}
          />
          <button
            type="button"
            disabled={isUploadingFolder || lessonsInCourse.length === 0}
            onClick={() => folderInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
          >
            <HiOutlineFolder className="h-4 w-4" />
            Choose folder
          </button>
          <span className="text-xs text-slate-500">
            {selectedCourse
              ? `Target course: ${selectedCourse.title}`
              : "Select a course first."}
            {lessonsInCourse.length === 0 ? " This course has no lessons yet." : ""}
          </span>
        </div>

        {folderItems.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold text-slate-700">
                {uploadedFolderCount} uploaded · {failedFolderCount} failed · {skippedFolderCount} skipped ·{" "}
                {pendingFolderItems.length} ready
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFolderItems([])}
                  disabled={isUploadingFolder}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <HiOutlineXMark className="h-3.5 w-3.5" />
                  Clear report
                </button>
                <button
                  type="button"
                  onClick={uploadFolder}
                  disabled={isUploadingFolder || pendingFolderItems.length === 0}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {isUploadingFolder
                    ? `Uploading ${folderProgress.done}/${folderProgress.total}...`
                    : `Upload ${pendingFolderItems.length} file${pendingFolderItems.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </div>

            {folderProgress.total > 0 && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {folderProgress.done} of {folderProgress.total} files processed ({progressPercent}%)
                </p>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Size</th>
                    <th className="px-3 py-2 font-semibold">Lesson</th>
                    <th className="px-3 py-2 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {folderItems.map((item) => (
                    <tr key={item.key} className="align-top">
                      <td className="max-w-[18rem] px-3 py-2 text-slate-700">{item.fileName}</td>
                      <td className="px-3 py-2 text-slate-500">{formatFileSize(item.fileSize)}</td>
                      <td className="max-w-[12rem] px-3 py-2 text-slate-700">
                        {item.lessonTitle || "—"}
                      </td>
                      <td className="max-w-[20rem] px-3 py-2">
                        <span className={statusClasses(item.status)}>
                          {statusLabel(item.status)}
                        </span>
                        <span className="mt-0.5 block text-slate-500">{item.message}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
