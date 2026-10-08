"use client"

import React, { useState } from "react"
import Link from "next/link"
import { MockCourse } from "@/lib/data/adminMockData"
import { formatNumber, getErrorMessage } from "@/lib/utils"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineStar,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2"

type CourseAction = {
  success: boolean
  message?: string
  error?: string
}

async function postCourseAction(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/admin/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  })
  const data = (await res.json().catch(() => null)) as CourseAction | null
  if (!res.ok) throw new Error(getErrorMessage(data, "The change could not be saved."))
}

export default function CoursesClient({
  initialCourses,
  knownDomains,
}: {
  initialCourses: MockCourse[]
  knownDomains: string[]
}) {
  const [courses, setCourses] = useState<MockCourse[]>(initialCourses)
  const [searchQuery, setSearchQuery] = useState("")
  const [domainFilter, setDomainFilter] = useState("all")
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [domainDrafts, setDomainDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialCourses.map((course) => [course.id, course.category]))
  )
  const [savingDomainId, setSavingDomainId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const observedDomains = Array.from(
    new Set(courses.map((course) => course.category).filter((category) => category.trim()))
  )
  const domainOptions = Array.from(new Set([...knownDomains, ...observedDomains])).sort((a, b) =>
    a.localeCompare(b)
  )

  const filteredCourses = courses.filter((course) => {
    const category = (course.category ?? "").trim()
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.short_description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDomain = domainFilter === "all" || category === domainFilter.trim()
    return matchesSearch && matchesDomain
  })

  const groupedCourses = (() => {
    if (domainFilter !== "all") {
      return [{ domain: domainFilter.trim() || "Unassigned", courses: filteredCourses }]
    }
    const buckets = new Map<string, MockCourse[]>()
    for (const course of filteredCourses) {
      const domain = course.category.trim() || "Unassigned"
      const bucket = buckets.get(domain)
      if (bucket) bucket.push(course)
      else buckets.set(domain, [course])
    }
    return domainOptions
      .filter((domain) => buckets.has(domain))
      .map((domain) => ({ domain, courses: buckets.get(domain) ?? [] }))
      .concat(
        Array.from(buckets.entries())
          .filter(([domain]) => !domainOptions.includes(domain))
          .map(([domain, grouped]) => ({ domain, courses: grouped }))
      )
  })()

  const applyCourseUpdate = (courseId: string, patch: Partial<MockCourse>) => {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, ...patch } : c)))
  }

  const runToggle = async (
    course: MockCourse,
    action: "toggle_course_publish" | "toggle_course_popular",
    patch: Partial<MockCourse>,
    revert: Partial<MockCourse>
  ) => {
    if (isUpdating) return
    setIsUpdating(course.id)
    setError("")
    setNotice("")
    applyCourseUpdate(course.id, patch)
    try {
      await postCourseAction(action, { id: course.id, ...patch })
      setNotice(
        action === "toggle_course_publish"
          ? `${course.title} is now ${patch.is_published ? "published" : "a draft"}.`
          : `${course.title} is now ${patch.is_popular ? "featured" : "standard"}.`
      )
    } catch (err) {
      console.error(`Course action ${action} failed:`, err)
      applyCourseUpdate(course.id, revert)
      setError(getErrorMessage(err, "The course change could not be saved."))
    } finally {
      setIsUpdating(null)
    }
  }

  const togglePublish = (course: MockCourse) =>
    runToggle(
      course,
      "toggle_course_publish",
      { is_published: !course.is_published },
      { is_published: course.is_published }
    )

  const togglePopular = (course: MockCourse) =>
    runToggle(
      course,
      "toggle_course_popular",
      { is_popular: !course.is_popular },
      { is_popular: course.is_popular }
    )

  const saveDomain = async (course: MockCourse) => {
    const draft = (domainDrafts[course.id] ?? course.category).trim()
    if (!draft) {
      setError("Enter a domain name before saving.")
      return
    }
    if (draft === (course.category ?? "").trim()) return
    if (savingDomainId) return

    setSavingDomainId(course.id)
    setError("")
    setNotice("")
    try {
      await postCourseAction("update_course_domain", { id: course.id, category: draft })
      applyCourseUpdate(course.id, { category: draft })
      setNotice(`${course.title} moved to the ${draft} domain.`)
    } catch (err) {
      console.error("Course domain update failed:", err)
      setDomainDrafts((prev) => ({ ...prev, [course.id]: course.category }))
      setError(getErrorMessage(err, "The domain could not be saved."))
    } finally {
      setSavingDomainId(null)
    }
  }

  return (
    <div className="space-y-6">
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || notice}
        </p>
      )}

      {/* Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Academy Course Catalog & Curricula
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign each course to a domain, control publication, and jump to its lesson materials.
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
            <label htmlFor="domain-filter" className="text-xs font-semibold text-slate-500">
              Domain
            </label>
            <select
              id="domain-filter"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none"
            >
              <option value="all">All Domains</option>
              {domainOptions.map((domain) => {
                const count = courses.filter(
                  (course) => (course.category || "").trim() === domain
                ).length
                return (
                  <option key={domain} value={domain}>
                    {domain} ({count})
                  </option>
                )
              })}
            </select>
          </div>
        </div>
      </div>

      <datalist id="course-domain-options">
        {domainOptions.map((domain) => (
          <option key={domain} value={domain} />
        ))}
      </datalist>

      {groupedCourses.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-card text-center text-sm text-slate-500">
          No courses match the current search and domain filter.
        </div>
      ) : (
        groupedCourses.map((group) => (
          <div key={group.domain} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {group.domain}
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                {group.courses.length}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            {group.courses.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
                No courses in this domain match the current search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {group.courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                        <span className="sr-only">Domain for {course.title}</span>
                        <input
                          list="course-domain-options"
                          value={domainDrafts[course.id] ?? course.category}
                          onChange={(e) =>
                            setDomainDrafts((prev) => ({ ...prev, [course.id]: e.target.value }))
                          }
                          disabled={savingDomainId === course.id}
                          maxLength={80}
                          placeholder="Assign domain"
                          className="w-36 rounded-md border border-brand-primary/20 bg-brand-light px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60"
                        />
                        {(domainDrafts[course.id] ?? course.category).trim() !==
                          course.category.trim() && (
                          <button
                            type="button"
                            onClick={() => saveDomain(course)}
                            disabled={savingDomainId === course.id}
                            className="rounded bg-brand-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {savingDomainId === course.id ? "Saving" : "Save"}
                          </button>
                        )}
                      </label>
                      <span className="text-xs font-bold text-slate-900">
                        ₦{formatNumber(course.price_ngn)}
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

                  {/* Admin Toggles & Links */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* Publish Toggle */}
                      <button
                        onClick={() => togglePublish(course)}
                        disabled={isUpdating === course.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60 ${
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
                        disabled={isUpdating === course.id}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-60 ${
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

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/course-content?course=${course.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand-primary"
                      >
                        <span>Materials</span>
                        <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href={`/learning-hub`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                      >
                        <span>Live Preview</span>
                        <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
