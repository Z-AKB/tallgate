import Link from "next/link"
import {
  HiOutlineAcademicCap,
  HiOutlineArrowDownTray,
  HiOutlineArrowRight,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlinePlay,
  HiOutlineVideoCamera,
} from "react-icons/hi2"
import { requireUser } from "@/lib/auth/guards"
import { getPortalOverview, type PortalCertificate, type PortalLiveSession } from "@/lib/dashboard/getPortalOverview"
import { getPortalPresentation } from "@/lib/auth/roles"
import { formatCertificateIssueDate } from "@/lib/certificates/date"
import { CourseThumbnail } from "@/components/dashboard/CourseThumbnail"
import { MyCoursesGrid } from "@/components/dashboard/MyCoursesGrid"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { ProgressBar } from "@/components/dashboard/ProgressBar"

export const metadata = {
  title: "Account Dashboard | TallGate",
  description: "Manage your account, view services, and explore TallGate programs.",
}

const SESSION_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

function formatSessionDate(scheduledAt: string): string {
  return `${SESSION_DATE_FORMAT.format(new Date(scheduledAt))} UTC`
}

export default async function DashboardPage() {
  const user = await requireUser()
  const overview = await getPortalOverview(user)
  const firstName = user.profile?.full_name?.split(" ")[0] || "there"
  const { isAdmin, isLearner } = getPortalPresentation(user.roles)
  const isFounder = !isAdmin && user.roles.includes("startup_founder")

  const heroCourse = overview.enrollments
    .filter((enrollment) => enrollment.status === "active" && enrollment.course_slug)
    .sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt))[0]

  const validCertificates = overview.certificates.filter((certificate) => certificate.is_valid)
  const hasUpcoming = overview.upcomingSessions.length > 0
  const hasRecordings = overview.recordedPastSessions.length > 0
  const showLiveClasses = hasUpcoming || hasRecordings

  const learnedCount = overview.enrollments.filter(
    (enrollment) => enrollment.status === "active" || enrollment.status === "completed"
  ).length

  return (
    <div className="space-y-10">
      {/* Welcome strip */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLearner
              ? `${learnedCount} course${learnedCount === 1 ? "" : "s"} in progress · ${validCertificates.length} certificate${validCertificates.length === 1 ? "" : "s"} earned`
              : "Overview of your TallGate account and technology services."}
          </p>
        </div>
        {isLearner && overview.enrollments.length > 0 ? (
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
          >
            Browse all courses
            <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </section>

      {overview.learningResourcesWarning ? (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {overview.learningResourcesWarning}
        </p>
      ) : null}

      {isLearner ? (
        <>
          {/* Continue learning hero */}
          <section aria-label="Continue learning">
            {heroCourse ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <Link
                    href={`/learn/courses/${heroCourse.course_slug}/learn${heroCourse.nextLessonId ? `?lessonId=${heroCourse.nextLessonId}` : ""}`}
                    className="group relative block min-h-[220px]"
                    aria-label={`Continue ${heroCourse.course_title}`}
                  >
                    <CourseThumbnail category={heroCourse.category} className="absolute inset-0 h-full w-full" />
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition-colors group-hover:text-brand-primary">
                      <HiOutlinePlay className="h-3.5 w-3.5 text-brand-primary" />
                      Continue learning
                    </span>
                  </Link>
                  <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                        {heroCourse.category || "Course"}
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                        {heroCourse.course_title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        {heroCourse.progress_percent === 0
                          ? heroCourse.nextLessonTitle
                            ? `Start with: ${heroCourse.nextLessonTitle}`
                            : "This course has no lessons published yet."
                          : heroCourse.nextLessonTitle
                            ? `Next up: ${heroCourse.nextLessonTitle}`
                            : `${heroCourse.progress_percent}% complete`}
                      </p>
                    </div>
                    <ProgressBar value={heroCourse.progress_percent} />
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/learn/courses/${heroCourse.course_slug}/learn${heroCourse.nextLessonId ? `?lessonId=${heroCourse.nextLessonId}` : ""}`}
                        className="btn-primary-light"
                      >
                        {heroCourse.progress_percent === 0 ? "Start course" : "Continue course"}
                      </Link>
                      <Link
                        href={`/learn/courses/${heroCourse.course_slug}`}
                        className="btn-ghost-light"
                      >
                        Course overview
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : overview.enrollments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <DashboardEmptyState
                  icon={<HiOutlineAcademicCap className="h-10 w-10" />}
                  title="Your learning journey starts here"
                  description="Browse the catalogue and enrol in a TallGate program to see your progress, live classes, and certificates in one place."
                  actionLabel="Explore courses"
                  actionHref="/dashboard/courses"
                />
              </div>
            ) : null}
          </section>

          {/* My courses */}
          <section aria-labelledby="my-courses-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="my-courses-heading" className="text-lg font-bold text-slate-900">
                My courses
              </h2>
            </div>
            {overview.enrollments.length === 0 ? (
              <DashboardEmptyState
                icon={<HiOutlineAcademicCap className="h-8 w-8" />}
                title="No courses yet"
                description="When you enrol in a program it will appear here with your progress."
                actionLabel="Browse catalogue"
                actionHref="/dashboard/courses"
              />
            ) : (
              <MyCoursesGrid enrollments={overview.enrollments} />
            )}
          </section>

          {/* Upcoming live classes */}
          {showLiveClasses ? (
            <section aria-labelledby="live-classes-heading">
              <h2 id="live-classes-heading" className="mb-4 text-lg font-bold text-slate-900">
                Live classes
              </h2>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {hasUpcoming ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <HiOutlineCalendarDays className="h-4 w-4 text-brand-primary" />
                      <h3 className="text-sm font-semibold text-slate-900">Upcoming classes</h3>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {overview.upcomingSessions.slice(0, 4).map((session) => (
                        <LiveClassRow key={session.id} session={session} />
                      ))}
                    </ul>
                  </div>
                ) : null}
                {hasRecordings ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <HiOutlineVideoCamera className="h-4 w-4 text-brand-primary" />
                      <h3 className="text-sm font-semibold text-slate-900">Class recordings</h3>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {overview.recordedPastSessions.map((session) => (
                        <RecordedClassRow key={session.id} session={session} />
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Certificates */}
          {validCertificates.length > 0 ? (
            <section aria-labelledby="certificates-heading">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="certificates-heading" className="text-lg font-bold text-slate-900">
                  Certificates
                </h2>
                <Link
                  href="/dashboard/certificates"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"
                >
                  View all
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {validCertificates.slice(0, 3).map((certificate) => (
                  <CertificateCard key={certificate.id} certificate={certificate} />
                ))}
              </ul>
            </section>
          ) : null}

          {/* Explore more */}
          {overview.exploreCourses.length > 0 ? (
            <section aria-labelledby="explore-heading">
              <h2 id="explore-heading" className="mb-4 text-lg font-bold text-slate-900">
                Explore more courses
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {overview.exploreCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/learn/courses/${course.slug}`}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CourseThumbnail category={course.category} className="aspect-video w-full" />
                    <div className="p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                        {course.category || "Course"}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 transition-colors group-hover:text-brand-primary">
                        {course.title}
                      </h3>
                      <p className="mt-2 text-[11px] text-slate-500">
                        {[course.level, course.duration].filter(Boolean).join(" · ") || "TallGate Academy"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your TallGate account</h2>
              <p className="mt-1 max-w-xl text-sm text-slate-500">
                {isFounder
                  ? "Track your ventures, consulting requests, and explore the services available to your organisation."
                  : "Explore the technology services available to you, book a consultation, or get in touch with our team."}
              </p>
            </div>
            <Link href="/dashboard/services" className="btn-primary-light shrink-0">
              <HiOutlineBriefcase className="mr-2 h-4 w-4" />
              Our Other Services
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

function LiveClassRow({ session }: { session: PortalLiveSession }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{session.course_title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{formatSessionDate(session.scheduled_at)}</p>
      </div>
      {session.join_url ? (
        <a
          href={session.join_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-default-light shrink-0 text-xs"
        >
          Join
        </a>
      ) : null}
    </li>
  )
}

function RecordedClassRow({ session }: { session: PortalLiveSession }) {
  if (!session.recording_lesson_id) return null
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">{session.title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {session.course_title}
          {session.recording_title ? ` · ${session.recording_title}` : ""}
        </p>
      </div>
      <Link
        href={`/learn/courses/${session.course_slug}/learn?lessonId=${session.recording_lesson_id}`}
        className="btn-ghost-light shrink-0 text-xs"
      >
        Watch
      </Link>
    </li>
  )
}

function CertificateCard({ certificate }: { certificate: PortalCertificate }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">Certificate</p>
      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{certificate.course_title}</h3>
      <p className="mt-2 text-xs text-slate-500">
        Issued {formatCertificateIssueDate(certificate.issue_date, "long")}
        {certificate.grade ? ` · ${certificate.grade}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={`/verify?code=${certificate.verification_code}`}
          className="btn-ghost-light text-xs"
        >
          View
        </Link>
        {certificate.hasDocument ? (
          <a href={`/api/certificates/${certificate.id}/download`} className="btn-default-light text-xs">
            <HiOutlineArrowDownTray className="mr-1.5 h-3.5 w-3.5" />
            Download
          </a>
        ) : null}
      </div>
    </li>
  )
}