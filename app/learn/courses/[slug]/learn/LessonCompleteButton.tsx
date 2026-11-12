"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HiOutlineCheckCircle, HiOutlineArrowPath } from "react-icons/hi2"
import { completeLesson } from "@/lib/learning/actions"

type Props = {
  lessonId: string
  initialCompleted: boolean
}

export default function LessonCompleteButton({ lessonId, initialCompleted }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [completed, setCompleted] = useState(initialCompleted)
  const [error, setError] = useState<string | null>(null)
  const [courseCompleted, setCourseCompleted] = useState(false)
  const [certificateStatus, setCertificateStatus] = useState<
    "created" | "existing" | "none" | "failed"
  >("none")

  const onComplete = () => {
    if (completed || isPending) return
    setError(null)

    startTransition(async () => {
      try {
        const result = await completeLesson(lessonId)
        if (!result.ok) {
          setError(result.error)
          return
        }
        setCompleted(true)
        setCourseCompleted(result.courseCompleted)
        setCertificateStatus(result.certificateStatus)
        router.refresh()
      } catch {
        setError("Your progress could not be saved.")
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onComplete}
        disabled={completed || isPending}
        aria-disabled={completed || isPending}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/60 ${
          completed
            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-default"
            : "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
        }`}
      >
        {isPending ? (
          <>
            <HiOutlineArrowPath className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Saving...</span>
          </>
        ) : completed ? (
          <>
            <HiOutlineCheckCircle className="h-4 w-4" aria-hidden="true" />
            <span>Completed</span>
          </>
        ) : (
          <span>Mark as Complete</span>
        )}
      </button>

      <div aria-live="polite" className="min-h-[1.25rem]">
        {completed && !isPending && (
          <p
            className={`text-xs ${
              certificateStatus === "failed" ? "text-amber-300" : "text-emerald-300"
            }`}
          >
            {certificateStatus === "created" || certificateStatus === "existing"
              ? "Course complete — your certificate has been issued."
              : certificateStatus === "failed"
                ? "Course complete, but the certificate could not be issued automatically. Please contact support."
                : courseCompleted
                  ? "Lesson completed. Course requirements are complete."
                  : "Lesson marked as complete."}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}