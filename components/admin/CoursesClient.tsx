"use client"

import React, { useState } from "react"
import Link from "next/link"
import { MockCourse } from "@/lib/data/adminMockData"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineStar,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2"

export default function CoursesClient({
  initialCourses,
}: {
  initialCourses: MockCourse[]
}) {
  const [courses, setCourses] = useState<MockCourse[]>(initialCourses)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const categories = Array.from(new Set(courses.map((c) => c.category)))

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const togglePublish = async (course: MockCourse) => {
    const nextState = !course.is_published
    setIsUpdating(course.id)
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, is_published: nextState } : c))
    )

    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_course_publish",
          payload: { id: course.id, is_published: nextState },
        }),
      })
    } catch (err) {
      console.error("Error toggling course publish status:", err)
    } finally {
      setIsUpdating(null)
    }
  }

  const togglePopular = async (course: MockCourse) => {
    const nextState = !course.is_popular
    setIsUpdating(course.id)
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, is_popular: nextState } : c))
    )

    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_course_popular",
          payload: { id: course.id, is_popular: nextState },
        }),
      })
    } catch (err) {
      console.error("Error toggling course popular status:", err)
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Academy Course Catalog & Curricula
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Control course publication, spotlight popular tracks, and review curriculum pricing.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            {filteredCourses.length} Courses Active
          </span>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none"
            >
              <option value="all">All Domains</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-light text-brand-primary border border-brand-primary/20">
                  {course.category}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  ₦{course.price_ngn.toLocaleString()}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{course.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {course.short_description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>⏱ {course.duration}</span>
                <span>•</span>
                <span>🎓 {course.level}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">
                  👥 {course.enrollment_count} Enrolled
                </span>
              </div>
            </div>

            {/* Admin Toggles & Public Link */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {/* Publish Toggle */}
                <button
                  onClick={() => togglePublish(course)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    course.is_published
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {course.is_published ? "● Published" : "○ Draft"}
                </button>

                {/* Popular Toggle */}
                <button
                  onClick={() => togglePopular(course)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    course.is_popular
                      ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  }`}
                  title="Spotlight on Landing / Hub"
                >
                  <HiOutlineStar className={`w-3.5 h-3.5 ${course.is_popular ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{course.is_popular ? "Featured" : "Standard"}</span>
                </button>
              </div>

              <Link
                href={`/learning-hub`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
              >
                <span>Live Preview</span>
                <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
