"use client"

import { useState } from "react"
import { getErrorMessage } from "@/lib/utils"
import Link from "next/link"
import { coursesData } from "@/lib/data/courses"
import {
  HiOutlineAcademicCap,
  HiOutlineRocketLaunch,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCheck,
  HiOutlineUserGroup,
  HiOutlineSparkles,
} from "react-icons/hi2"

export default function UserCoursesPage() {
  const [activeTab, setActiveTab] = useState<"courses" | "startups">("courses")
  const [enrolledCourse, setEnrolledCourse] = useState<string | null>(null)
  const [enrollForm, setEnrollForm] = useState({ fullName: "", email: "", phone: "" })
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [enrollDone, setEnrollDone] = useState(false)

  const openEnroll = (title: string) => {
    setEnrolledCourse(title)
    setEnrollForm({ fullName: "", email: "", phone: "" })
    setEnrollError(null)
    setEnrollDone(false)
  }

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrolledCourse) return
    setEnrollLoading(true)
    setEnrollError(null)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: enrollForm.fullName,
          email: enrollForm.email,
          phone: enrollForm.phone,
          courseTitle: enrolledCourse,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit enrollment.")
      setEnrollDone(true)
    } catch (err: unknown) {
      setEnrollError(getErrorMessage(err, "Failed to submit enrollment."))
    } finally {
      setEnrollLoading(false)
    }
  }

  const startupPillars = [
    {
      title: "Venture Prototype Accelerator",
      tagline: "Build & Ship your MVP in 8 Weeks",
      description: "Hands-on engineering support, architectural blueprints, and weekly sprint reviews to take your concept from wireframe to production.",
      deliverables: ["Product Architecture Blueprint", "Full-Stack MVP Development", "AWS/Cloud Deployment", "Security & Data Governance"],
    },
    {
      title: "Fractional CTO Advisory",
      tagline: "Senior Technical Leadership on Demand",
      description: "Guidance on technical strategy, vendor selection, developer hiring panels, and code auditing without the executive full-time salary.",
      deliverables: ["Tech Due Diligence Audits", "Developer Interview Panels", "Sprint & Agile Governance", "Security & Compliance Check"],
    },
    {
      title: "Investor Demo & Capital Readiness",
      tagline: "Position for Angel & Seed Investment",
      description: "Pitch deck reviews, technical valuation defense, and direct introductions to our regional angel syndicates and venture partners.",
      deliverables: ["Pitch Deck Technical Audit", "Investor Q&A Dry Runs", "Angel Syndicate Introductions", "Pilot Partner Matchmaking"],
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">
              <HiOutlineAcademicCap className="w-4 h-4" />
              <span>Academy & Venture Programs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              More Courses & Programs
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Advance your technical mastery with our hands-on Abuja computer lab cohorts or launch your startup through our venture incubation tracks.
            </p>
          </div>

          <Link href="/dashboard" className="btn-secondary text-xs self-start sm:self-auto">
            ← Back to Overview
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "courses"
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            <HiOutlineAcademicCap className="w-4 h-4" />
            <span>Academy Courses ({coursesData.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("startups")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "startups"
                ? "bg-brand-primary text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            <HiOutlineRocketLaunch className="w-4 h-4" />
            <span>Startup Hub Programs (3)</span>
          </button>
        </div>
      </div>

      {/* Courses Tab View */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesData.map((course) => (
            <div
              key={course.slug}
              className="card-base bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                    {course.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {course.level}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {course.shortDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <HiOutlineClock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.duration}</span>
                  </span>
                  <span className="font-bold text-slate-900">₦{course.priceNgn.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => openEnroll(course.title)}
                  className="btn-primary w-full justify-center text-xs py-2"
                >
                  Enroll in Cohort
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Startup Programs Tab View */}
      {activeTab === "startups" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {startupPillars.map((prog, idx) => (
            <div
              key={idx}
              className="card-base bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-primary">
                  <HiOutlineRocketLaunch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {prog.title}
                  </h3>
                  <p className="text-xs font-semibold text-brand-primary mt-1">
                    {prog.tagline}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Program Deliverables
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {prog.deliverables.map((item, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2">
                        <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <button
                  onClick={() => openEnroll(prog.title)}
                  className="btn-secondary w-full justify-center text-xs py-2"
                >
                  Apply for Track
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-Portal Enrollment Dialog */}
      {enrolledCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enrollment Application</h3>
                <p className="text-xs text-slate-500">{enrolledCourse}</p>
              </div>
              <button
                onClick={() => setEnrolledCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {enrollDone ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <HiOutlineCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Application Submitted</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your enrollment application for <strong>{enrolledCourse}</strong> has been received.
                  Our admissions team will contact you with batch timetables and onboarding details.
                </p>
                <button
                  onClick={() => setEnrolledCourse(null)}
                  className="btn-primary text-xs mt-3"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={enrollForm.fullName}
                    onChange={(e) => setEnrollForm((p) => ({ ...p, fullName: e.target.value }))}
                    disabled={enrollLoading}
                    placeholder="Your full name"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={enrollForm.email}
                    onChange={(e) => setEnrollForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={enrollLoading}
                    placeholder="you@example.com"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm((p) => ({ ...p, phone: e.target.value }))}
                    disabled={enrollLoading}
                    placeholder="+234..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
                  />
                </div>

                {enrollError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{enrollError}</p>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEnrolledCourse(null)}
                    className="btn-ghost text-xs"
                    disabled={enrollLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrollLoading}
                    className="btn-primary text-xs disabled:opacity-60"
                  >
                    {enrollLoading ? "Submitting…" : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
