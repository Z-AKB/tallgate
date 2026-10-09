import Link from "next/link"
import type { PortalEnrollment } from "@/lib/dashboard/getPortalOverview"
import { CourseThumbnail } from "@/components/dashboard/CourseThumbnail"
import { ProgressBar } from "@/components/dashboard/ProgressBar"

type CourseCardProps = {
  enrollment: PortalEnrollment
}

export function CourseCard({ enrollment }: CourseCardProps) {
  const learnHref = enrollment.course_slug
    ? `/learn/courses/${enrollment.course_slug}/learn${enrollment.nextLessonId ? `?lessonId=${enrollment.nextLessonId}` : ""}`
    : null
  const isCompleted = enrollment.status === "completed"
  const actionLabel = isCompleted ? "Review" : enrollment.progress_percent > 0 ? "Continue" : "Start"

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={learnHref ?? "#"} aria-label={enrollment.course_title} tabIndex={learnHref ? 0 : -1}>
        <CourseThumbnail category={enrollment.category} className="aspect-video w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
            {enrollment.category || "Course"}
          </p>
          <Link
            href={learnHref ?? "#"}
            className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-brand-primary transition-colors"
            tabIndex={learnHref ? 0 : -1}
          >
            {enrollment.course_title}
          </Link>
        </div>

        <div className="mt-auto space-y-2.5">
          {!enrollment.nextLessonTitle && enrollment.progress_percent === 0 ? null : (
            <p className="truncate text-[11px] text-slate-500">
              {isCompleted
                ? enrolledDateLabel(enrollment.enrolled_at)
                : enrollment.nextLessonTitle
                  ? `Next: ${enrollment.nextLessonTitle}`
                  : enrolledDateLabel(enrollment.enrolled_at)}
            </p>
          )}
          {!isCompleted ? <ProgressBar value={enrollment.progress_percent} /> : null}
          {learnHref ? (
            <Link
              href={learnHref}
              className={`${isCompleted ? "btn-default-light" : "btn-primary-light"} mt-1 inline-flex w-full justify-center text-xs`}
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function enrolledDateLabel(enrolledAt: string): string {
  if (!enrolledAt) return ""
  return `Enrolled ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(enrolledAt))}`
}