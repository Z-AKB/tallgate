import Link from "next/link"
import {
  HiOutlineAcademicCap,
  HiOutlineRocketLaunch,
  HiOutlineBriefcase,
} from "react-icons/hi2"
import { requireUser } from "@/lib/auth/guards"
import { getPortalOverview } from "@/lib/dashboard/getPortalOverview"
import { formatDate } from "@/lib/utils"
import { getPortalPresentation } from "@/lib/auth/roles"

export const metadata = {
  title: "Account Dashboard | TallGate",
  description: "Manage your account, view services, and explore TallGate programs.",
}

export default async function DashboardPage() {
  const user = await requireUser()
  const overview = await getPortalOverview(user)
  const firstName = user.profile?.full_name?.split(" ")[0] || "there"
  const { isAdmin, isLearner } = getPortalPresentation(user.roles)
  const isFounder = !isAdmin && user.roles.includes("startup_founder")
  const summaryCardCount = 1 + Number(isLearner) + Number(isFounder)
  const summaryGridColumns =
    summaryCardCount === 1
      ? "sm:grid-cols-1"
      : summaryCardCount === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3"

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isLearner
              ? "Overview of your active training programs, enrolled cohorts, and technology services."
              : "Overview of your TallGate account and technology services."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isLearner ? (
            <Link href="/dashboard/courses" className="btn-primary text-xs">
              More Courses & Programs
            </Link>
          ) : null}
          <Link href="/dashboard/services" className="btn-secondary text-xs">
            Our Other Services
          </Link>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${summaryGridColumns} gap-6`}>
        {isLearner ? (
          <div className="card-base bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Academy Courses</span>
              <HiOutlineAcademicCap className="w-5 h-5 text-brand-primary" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{overview.activeCourses} Active</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {overview.enrollments.length} total enrollment{overview.enrollments.length === 1 ? "" : "s"}
            </p>
          </div>
        ) : null}

        {isFounder ? (
          <div className="card-base bg-white border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Startup Tracks</span>
              <HiOutlineRocketLaunch className="w-5 h-5 text-brand-primary" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{overview.startupApplications} Submitted</p>
            <p className="text-[11px] text-slate-500 mt-1">Venture incubator applications</p>
          </div>
        ) : null}

        <div className="card-base bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Enterprise Services</span>
            <HiOutlineBriefcase className="w-5 h-5 text-brand-primary" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{overview.serviceRequests} Active</p>
          <p className="text-[11px] text-slate-500 mt-1">Consultation and advisory requests</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isLearner ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-8`}>
        {isLearner ? (
          <div className="card-base bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HiOutlineAcademicCap className="w-4 h-4 text-brand-primary" />
                <span>My Enrolled Courses</span>
              </h3>
              <Link href="/dashboard/courses" className="text-xs font-semibold text-brand-primary hover:underline">
                Explore courses →
              </Link>
            </div>

            {overview.enrollments.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-700">No active course enrollments yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Browse our engineering, cybersecurity, and digital tracks to begin learning.
                </p>
                <Link href="/dashboard/courses" className="btn-secondary text-xs mt-3 inline-block">
                  Browse Available Courses
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {overview.enrollments.slice(0, 5).map((enrollment) => (
                  <li
                    key={enrollment.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{enrollment.course_title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {enrollment.status} · {enrollment.progress_percent}% complete
                        {enrollment.enrolled_at ? ` · ${formatDate(enrollment.enrolled_at)}` : ""}
                      </p>
                    </div>
                    {enrollment.course_slug ? (
                      <Link
                        href={`/learn/courses/${enrollment.course_slug}/learn`}
                        className="text-xs font-semibold text-brand-primary whitespace-nowrap"
                      >
                        Continue
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <div className="card-base bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <HiOutlineBriefcase className="w-4 h-4 text-brand-primary" />
              <span>Our Other Services</span>
            </h3>
            <Link href="/dashboard/services" className="text-xs font-semibold text-brand-primary hover:underline">
              View catalog →
            </Link>
          </div>

          <div className="text-center py-10 px-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Explore Enterprise Solutions</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              From bespoke web/mobile development and cloud engineering to IT consulting and security audits.
            </p>
            <Link href="/dashboard/services" className="btn-secondary text-xs mt-3 inline-block">
              View Our Other Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
