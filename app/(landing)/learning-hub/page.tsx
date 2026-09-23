"use client"

import { useState } from "react"
import Link from "next/link"
import { coursesData, CourseOffering } from "@/lib/data/courses"
import { formatNaira } from "@/lib/utils"
import SectionHeader from "@/components/ui/SectionHeader"
import CourseEnrollModal from "@/features/learning/CourseEnrollModal"
import {
  HiOutlineAcademicCap,
  HiCheckCircle,
} from "react-icons/hi"

export default function LearningHubPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedCourse, setSelectedCourse] = useState<CourseOffering | { title: string; monthlyPriceNgn?: number; totalDuration?: string } | null>(null)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)

  const categories = [
    "All",
    "Foundation",
    "Professional",
    "Digital Skills",
    "Security",
    "Development",
    "Health Technology",
  ]

  const filteredCourses =
    selectedCategory === "All"
      ? coursesData
      : coursesData.filter((c) => c.category === selectedCategory)

  const handleOpenEnroll = (course: any) => {
    setSelectedCourse(course)
    setIsEnrollModalOpen(true)
  }

  return (
    <div className="py-12 sm:py-20 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Official Online Training Packages"
          description="Choose a practical TallGate online package designed to build your digital, technical, and professional skills."
        />

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedCategory === cat
                  ? "bg-white text-slate-950 shadow-sm"
                  : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.slug}
              className="card-base flex flex-col justify-between hover:border-white/20 transition-all border-white/10"
            >
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {course.shortDescription}
                </p>

                <div className="flex items-baseline justify-between bg-white/[0.03] p-3 rounded-lg border border-white/10 mb-5">
                  <div>
                    <span className="text-xl font-bold text-white">{formatNaira(course.priceNgn)}</span>
                    <span className="text-xs text-slate-400 font-medium"> / total fee</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-200 block">{course.duration}</span>
                    <span className="text-xs text-slate-400">{course.format}</span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-6">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Curriculum Highlights:</p>
                  <ul className="space-y-1">
                    {course.learningOutcomes.slice(0, 3).map((outcome, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <HiCheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <Link
                  href={`/learning-hub/${course.slug}`}
                  prefetch={true}
                  className="text-xs font-semibold text-indigo-300 hover:text-white transition-colors"
                >
                  View Full Syllabus
                </Link>

                <button
                  onClick={() => handleOpenEnroll(course)}
                  className="btn-primary text-xs py-2 px-4"
                >
                  Apply & Enroll
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Banner */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="card-flat p-8 bg-white/[0.03] border border-white/10 text-center space-y-3">
          <HiOutlineAcademicCap className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">More Than Online Lessons</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Every package includes a certificate of completion, a conducive learning environment, professional instructors, and a free handbook or guide book.
          </p>
          <Link href="/contact" prefetch={true} className="btn-secondary text-xs inline-block mt-2">
            Get in Touch
          </Link>
        </div>
      </div>

      <CourseEnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        course={selectedCourse}
      />
    </div>
  )
}
