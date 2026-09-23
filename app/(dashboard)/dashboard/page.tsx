import Link from "next/link"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import {
  HiOutlineAcademicCap,
  HiOutlineRocketLaunch,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowRight,
} from "react-icons/hi2"

export const metadata = {
  title: "User Dashboard | TallGate",
  description: "Manage your courses, consultations, and startup applications.",
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-canvas">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Welcome to your Portal
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of your active training programs, consultations, and startup tracks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/learning-hub" className="btn-secondary text-xs">
                Browse Courses
              </Link>
              <Link href="/consultation" className="btn-primary text-xs">
                New Consultation
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card-base bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Academy Courses</span>
                <HiOutlineAcademicCap className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="text-2xl font-bold text-slate-900">0 Active</p>
              <p className="text-[11px] text-slate-500 mt-1">Enroll in a new cohort batch</p>
            </div>

            <div className="card-base bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Consultations</span>
                <HiOutlineBriefcase className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="text-2xl font-bold text-slate-900">0 In Progress</p>
              <p className="text-[11px] text-slate-500 mt-1">Technical scopes & requests</p>
            </div>

            <div className="card-base bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Startup Tracks</span>
                <HiOutlineRocketLaunch className="w-5 h-5 text-brand-primary" />
              </div>
              <p className="text-2xl font-bold text-slate-900">0 Submitted</p>
              <p className="text-[11px] text-slate-500 mt-1">Incubation applications</p>
            </div>
          </div>

          {/* Action Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Academy & Courses Section */}
            <div className="card-base bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HiOutlineAcademicCap className="w-4 h-4 text-brand-primary" />
                  <span>My Enrolled Courses</span>
                </h3>
                <Link href="/learning-hub" className="text-xs font-semibold text-brand-primary hover:underline">
                  Enroll in a course →
                </Link>
              </div>

              <div className="text-center py-10 px-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-700">No active course enrollments yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Browse our high-demand engineering, cybersecurity, and digital tracks to begin learning in our Abuja labs.
                </p>
                <Link href="/learning-hub" className="btn-secondary text-xs mt-3 inline-block">
                  Explore Learning Hub
                </Link>
              </div>
            </div>

            {/* Business Services & Consultations */}
            <div className="card-base bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HiOutlineBriefcase className="w-4 h-4 text-brand-primary" />
                  <span>Consultations & Scoping</span>
                </h3>
                <Link href="/consultation" className="text-xs font-semibold text-brand-primary hover:underline">
                  New request →
                </Link>
              </div>

              <div className="text-center py-10 px-4 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-700">No pending consultation requests</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Need custom software, cybersecurity audit, or AI automation? Book a scoping call with our lead architects.
                </p>
                <Link href="/consultation" className="btn-primary text-xs mt-3 inline-block">
                  Book Scoping Session
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
