"use client"

import { useMemo, useState } from "react"
import { HiOutlineAcademicCap } from "react-icons/hi2"
import { CourseCard } from "@/components/dashboard/CourseCard"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import type { PortalEnrollment } from "@/lib/dashboard/getPortalOverview"

type TabKey = "all" | "active" | "completed"

const EMPTY_COPY: Record<TabKey, { title: string; description: string }> = {
  all: {
    title: "You are not enrolled in any courses yet",
    description: "Browse the catalogue and enrol in a program to start learning with TallGate.",
  },
  active: {
    title: "No courses in progress",
    description: "Courses you start will appear here so you can pick up where you left off.",
  },
  completed: {
    title: "No completed courses",
    description: "Courses you finish will appear here, and any certificates you earn are listed below.",
  },
}

type MyCoursesGridProps = {
  enrollments: PortalEnrollment[]
}

export function MyCoursesGrid({ enrollments }: MyCoursesGridProps) {
  const [tab, setTab] = useState<TabKey>("all")

  const tabs = useMemo(
    () =>
      [
        { key: "all" as const, label: "All", count: enrollments.filter((item) => item.status !== "dropped").length },
        { key: "active" as const, label: "In progress", count: enrollments.filter((item) => item.status === "active").length },
        { key: "completed" as const, label: "Completed", count: enrollments.filter((item) => item.status === "completed").length },
      ],
    [enrollments]
  )

  const shownCourses = enrollments.filter((item) => {
    if (tab === "active") return item.status === "active"
    if (tab === "completed") return item.status === "completed"
    return item.status !== "dropped"
  })

  return (
    <div>
      <div role="tablist" aria-label="Filter my courses" className="flex flex-wrap items-center gap-1.5 pb-4">
        {tabs.map((tabItem) => {
          const selected = tab === tabItem.key
          return (
            <button
              key={tabItem.key}
              role="tab"
              id={`course-tab-${tabItem.key}`}
              aria-selected={selected}
              aria-controls="course-tab-panel"
              onClick={() => setTab(tabItem.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202DB8]/40 ${
                selected
                  ? "bg-[#031544] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {tabItem.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                  selected ? "bg-white/15 text-indigo-100" : "bg-white text-slate-500"
                }`}
              >
                {tabItem.count}
              </span>
            </button>
          )
        })}
      </div>

      {shownCourses.length === 0 ? (
        <DashboardEmptyState
          icon={<HiOutlineAcademicCap className="h-8 w-8" />}
          title={EMPTY_COPY[tab].title}
          description={EMPTY_COPY[tab].description}
          actionLabel="Browse Courses"
          actionHref="/dashboard/courses"
        />
      ) : (
        <div
          id="course-tab-panel"
          role="tabpanel"
          aria-labelledby={`course-tab-${tab}`}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {shownCourses.map((enrollment) => (
            <CourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  )
}