"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { HiOutlineAcademicCap, HiOutlineMagnifyingGlass } from "react-icons/hi2"

export type EnrolledCourse = {
  id: string
  slug: string
  title: string
  category: string
}

type CourseSearchProps = {
  courses: EnrolledCourse[]
  className?: string
  onNavigate?: () => void
}

export default function CourseSearch({ courses, className = "", onNavigate }: CourseSearchProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const matches = query.trim()
    ? courses
        .filter((course) => course.title.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 6)
    : []

  const goTo = (course: EnrolledCourse) => {
    setOpen(false)
    setQuery("")
    inputRef.current?.blur()
    onNavigate?.()
    router.push(`/learn/courses/${course.slug}/learn`)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlighted((index) => Math.min(matches.length - 1, index + 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlighted((index) => Math.max(0, index - 1))
    } else if (event.key === "Enter") {
      if (matches[highlighted]) goTo(matches[highlighted])
    } else if (event.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="course-search-results"
        aria-label="Search your courses"
        placeholder="Search your courses"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setHighlighted(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
        className="h-10 w-full rounded-lg border border-white/15 bg-white/10 pl-9 pr-3 text-sm text-white shadow-sm placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-white/25"
      />
      {open && query.trim().length > 0 && (
        <ul
          id="course-search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-elevated"
        >
          {matches.length === 0 ? (
            <li className="px-3.5 py-3 text-xs text-slate-500">No courses match &ldquo;{query.trim()}&rdquo;</li>
          ) : (
            matches.map((course, index) => (
              <li key={course.id} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goTo(course)}
                  className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors ${
                    index === highlighted ? "bg-brand-light text-slate-900" : "text-slate-700 hover:bg-brand-light"
                  }`}
                >
                  <HiOutlineAcademicCap className="h-4 w-4 shrink-0 text-brand-primary" />
                  <span className="min-w-0 flex-1 truncate">{course.title}</span>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {course.category || "Course"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}