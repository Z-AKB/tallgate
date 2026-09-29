"use client"

import { useState } from "react"
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
        <div className="flex items-center gap-2 mt-6">
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
                  onClick={() => setEnrolledCourse(course.title)}
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
                  onClick={() => setEnrolledCourse(prog.title)}
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
                <h3 className="text-lg font-bold text-slate-900">Program Application</h3>
                <p className="text-xs text-slate-500">{enrolledCourse}</p>
              </div>
              <button
                onClick={() => setEnrolledCourse(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <HiOutlineCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Interest Registered</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Admissions has received your request for <strong>{enrolledCourse}</strong>. You will be sent batch timetables and onboarding details to your student portal account.
              </p>
              <button
                onClick={() => setEnrolledCourse(null)}
                className="btn-primary text-xs mt-3"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
