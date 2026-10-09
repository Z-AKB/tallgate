import React from "react"
import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import {
  mockConsultations,
  mockStartups,
  mockCourses,
  mockEnrollments,
  mockMessages,
  type MockConsultation,
  type MockStartup,
  type MockCourse,
  type MockEnrollment,
  type MockMessage,
} from "@/lib/data/adminMockData"
import {
  toConsultation,
  toStartup,
  toCourse,
  toCertificate,
  toMessage,
  toEnrollment,
  type AdminCertificate,
} from "@/lib/data/adminRowMappers"
import { ADMIN_QUERY_LIMIT } from "@/lib/admin/queryLimits"
import {
  HiOutlineInboxStack,
  HiOutlineRocketLaunch,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineArrowRight,
  HiOutlineUsers,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
} from "react-icons/hi2"

export const metadata = {
  title: "Operations Overview | TallGate Admin",
  description: "Real-time metrics, intake queues, startup evaluation, and credentials dispatch.",
}

export default async function AdminOverviewPage() {
  const supabase = await createClient()
  const useMockData = !isSupabaseConfigured() && process.env.NODE_ENV === "development"

  // Mock data is only ever a development placeholder for an unconfigured
  // project. Once Supabase answers, its result is authoritative even when it
  // is empty: a zero-row table must render as empty, never as seeded rows.
  let consultations: MockConsultation[] = useMockData ? mockConsultations : []
  let startups: MockStartup[] = useMockData ? mockStartups : []
  let courses: MockCourse[] = useMockData ? mockCourses : []
  let enrollments: MockEnrollment[] = useMockData ? mockEnrollments : []
  let certificates: AdminCertificate[] = []
  let messages: MockMessage[] = useMockData ? mockMessages : []
  let dataWarning = ""

  if (!isSupabaseConfigured()) {
    dataWarning = useMockData
      ? "Supabase is not configured, so this overview is showing sample data."
      : "Metrics are unavailable because Supabase is not configured."
  } else {
    try {
      const [cRes, sRes, crsRes, enrRes, certRes, msgRes] = await Promise.all([
        supabase.from("consultation_requests").select("*").order("created_at", { ascending: false }).limit(ADMIN_QUERY_LIMIT),
        supabase.from("startup_applications").select("*").order("created_at", { ascending: false }).limit(ADMIN_QUERY_LIMIT),
        supabase.from("courses").select("*").order("created_at", { ascending: false }).limit(ADMIN_QUERY_LIMIT),
        supabase
          .from("course_enrollments")
          .select("*, profiles(full_name, email), courses(title)")
          .order("enrolled_at", { ascending: false })
          .limit(ADMIN_QUERY_LIMIT),
        supabase.from("certificates").select("*").order("created_at", { ascending: false }).limit(ADMIN_QUERY_LIMIT),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(ADMIN_QUERY_LIMIT),
      ])

      const failures: string[] = []

      if (cRes.error) failures.push("consultation requests")
      else consultations = (cRes.data ?? []).map(toConsultation)

      if (sRes.error) failures.push("startup applications")
      else startups = (sRes.data ?? []).map(toStartup)

      if (crsRes.error) failures.push("courses")
      else courses = (crsRes.data ?? []).map(toCourse)

      if (enrRes.error) failures.push("enrollments")
      else {
        enrollments = (enrRes.data ?? []).map((item) =>
          toEnrollment(item, "Student", "Technical Course")
        )
      }

      if (certRes.error) failures.push("certificates")
      else certificates = (certRes.data ?? []).map(toCertificate)

      if (msgRes.error) failures.push("messages")
      else messages = (msgRes.data ?? []).map(toMessage)

      if (failures.length > 0) {
        for (const result of [cRes, sRes, crsRes, enrRes, certRes, msgRes]) {
          if (result.error) console.error("Admin overview query failed:", result.error)
        }
        dataWarning = `Could not load ${failures.join(", ")}. The affected figures below may be understated.`
      }

      const truncated = [cRes, sRes, crsRes, enrRes, certRes, msgRes].some(
        (result) => (result.data?.length ?? 0) >= ADMIN_QUERY_LIMIT
      )
      if (truncated) {
        const truncationNotice = `Showing up to ${ADMIN_QUERY_LIMIT} rows per table; some figures may be understated.`
        dataWarning = dataWarning ? `${dataWarning} ${truncationNotice}` : truncationNotice
      }
    } catch (err) {
      console.error("Admin overview query failed:", err)
      dataWarning = "Metrics could not be loaded from Supabase. Figures below may be understated."
    }
  }

  // Calculated Stats
  const pendingConsultations = consultations.filter((c) => c.status === "pending").length
  const pendingStartups = startups.filter((s) => s.status === "submitted" || s.status === "under_review").length
  const unreadMessages = messages.filter((m) => m.status === "unread").length
  const totalStudents = enrollments.length
  const activeStudents = enrollments.filter((e) => e.status === "active").length
  const totalCertificates = certificates.length

  return (
    <div className="space-y-8">
      {dataWarning && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          {dataWarning}
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-[1.75rem] bg-gradient-to-r from-[#03184B] via-[#06245F] to-[#0D43A9] p-7 sm:p-9 lg:p-10 text-white relative overflow-hidden shadow-elevated border border-[#1C5BDD]">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-grid-dark opacity-30 pointer-events-none"></div>
        <div className="hidden lg:block absolute -right-12 -top-20 w-[28rem] h-[28rem] rounded-full border border-blue-400/30 bg-gradient-to-br from-blue-500/45 via-blue-700/20 to-transparent"></div>
        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-56 h-56 items-center justify-center rounded-[2.5rem] border border-blue-300/20 bg-[#061A4F]/50 shadow-2xl shadow-blue-950/40">
          <HiOutlineUsers className="w-20 h-20 text-blue-100" />
          <div className="absolute -top-5 -left-5 w-16 h-16 rounded-2xl bg-blue-500/60 border border-blue-300/30 flex items-center justify-center"><HiOutlineAcademicCap className="w-8 h-8" /></div>
          <div className="absolute -right-5 top-6 w-16 h-16 rounded-2xl bg-blue-500/60 border border-blue-300/30 flex items-center justify-center"><HiOutlineShieldCheck className="w-8 h-8" /></div>
          <div className="absolute -right-4 -bottom-5 w-16 h-16 rounded-2xl bg-blue-500/60 border border-blue-300/30 flex items-center justify-center"><HiOutlineRocketLaunch className="w-8 h-8" /></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300 flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4 text-indigo-300" />
              <span>Executive Command Center</span>
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              TallGate Operations & Delivery Triage
            </h1>
            <p className="text-blue-100 text-sm sm:text-lg leading-relaxed">
              Triage enterprise consultations, review tech startup incubation decks, oversee Academy cohorts, and issue verifiable credentials in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-white hover:bg-slate-100 shadow-md transition-all active:scale-95"
            >
              <HiOutlineInboxStack className="w-4 h-4 text-brand-primary" />
              <span>Consultation Queue ({pendingConsultations})</span>
            </Link>
            <Link
              href="/admin/certificates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all active:scale-95"
            >
              <HiOutlineIdentification className="w-4 h-4" />
              <span>Issue Certificate</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Card 1: Consultations */}
        <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-card hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Enterprise Leads
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
              <HiOutlineInboxStack className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{consultations.length}</span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {pendingConsultations} Pending Triage
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Scoping Submissions</span>
            <Link
              href="/admin/inquiries"
              className="font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
            >
              <span>Manage Queue</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Startup Applications */}
        <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-card hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Startup Incubation
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HiOutlineRocketLaunch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{startups.length}</span>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              {pendingStartups} Active Review
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Evaluation Matrix</span>
            <Link
              href="/admin/startups"
              className="font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Review Decks</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3: Academy Intake */}
        <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-card hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Academy Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalStudents}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {activeStudents} Active Cohort
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{courses.length} Active Courses</span>
            <Link
              href="/admin/enrollments"
              className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Cohort Data</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 4: Verified Credentials */}
        <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 border border-slate-200/90 shadow-card hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Issued Certificates
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineIdentification className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCertificates}</span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              100% Verifiable
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Public Registry</span>
            <Link
              href="/admin/certificates"
              className="font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>Issue / Lookup</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Quick Triage & Recent Incubation Pitches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Consultations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Enterprise Scoping Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">Direct client intake requiring technical triage</p>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
            >
              <span>View Full Queue ({consultations.length})</span>
              <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {consultations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-xs text-slate-500">
                No enterprise scoping requests yet.
              </p>
            ) : (
              consultations.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.full_name}</span>
                    {item.company_name && (
                      <span className="text-xs text-slate-500">• {item.company_name}</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-brand-primary">{item.service_interest}</p>
                  <p className="text-[11px] text-slate-500 break-words">{item.project_scope}</p>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end justify-between border-t sm:border-0 pt-2 sm:pt-0 border-slate-200/60">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      item.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : item.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : item.status === "contacted"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* Right 1 Col: Quick Incubation Funnel & Shortcuts */}
        <div className="space-y-6">
          {/* Startup Incubation Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Startup Pipeline</h3>
              <Link href="/admin/startups" className="text-xs font-semibold text-brand-primary hover:underline">
                View ({startups.length})
              </Link>
            </div>

            <div className="space-y-3">
              {startups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center text-xs text-slate-500">
                  No startup applications yet.
                </p>
              ) : (
                startups.slice(0, 3).map((startup) => (
                  <div key={startup.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{startup.company_name}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                        {startup.stage}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 break-words">{startup.industry}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Operations Actions */}
          <div className="bg-gradient-to-br from-slate-900 to-brand-navy rounded-2xl p-6 text-white space-y-4 shadow-elevated">
            <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <HiOutlineSparkles className="w-4 h-4 text-indigo-300" />
              <span>Direct Operational Actions</span>
            </h3>

            <div className="space-y-2">
              <Link
                href="/admin/certificates"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold transition-colors"
              >
                <span>Issue Verifiable Credential</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/courses"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold transition-colors"
              >
                <span>Manage Course Pricing & Curricula</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin/messages"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold transition-colors"
              >
                <span>General Contact Messages ({unreadMessages} unread)</span>
                <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
