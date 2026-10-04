import { notFound } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import Link from "next/link"
import { coursesData } from "@/lib/data/courses"
import { formatNaira } from "@/lib/utils"
import CourseEnrollAction from "@/features/learning/CourseEnrollAction"
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiCheckCircle,
  HiOutlineLocationMarker,
} from "react-icons/hi"

export function generateStaticParams() {
  return coursesData.map((course) => ({
    slug: course.slug,
  }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const course = coursesData.find((c) => c.slug === params.slug)
  if (!course) return { title: "Course Not Found" }

  return {
    title: `${course.title} | TallGate Learning Hub`,
    description: course.overview,
  }
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = coursesData.find((c) => c.slug === params.slug)

  if (!course) {
    notFound()
  }

  return (
    <div className="py-12 sm:py-20 space-y-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/learning-hub"
          prefetch={true}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          <span>Back to All Courses</span>
        </Link>

        {/* Course Header */}
        <div className="space-y-4 border-b border-white/10 pb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            {course.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            {course.overview}
          </p>
        </div>

        {/* Content & Sidebar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
          {/* Main Syllabus & Outcomes */}
          <div className="md:col-span-2 space-y-10">
            {/* Learning Outcomes */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-4">
                What You Will Learn & Build
              </h2>
              <div className="space-y-3">
                {course.learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="card-flat p-4 flex items-start gap-3 bg-white/[0.03] border border-white/10">
                    <HiCheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-200 leading-relaxed font-medium">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Module Syllabus */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-4">
                Detailed Course Curriculum
              </h2>

              <div className="space-y-4">
                {course.syllabus.map((mod, idx) => (
                  <div key={idx} className="card-base rounded-xl p-5 border-white/10">
                    <h3 className="text-sm font-bold text-white tracking-tight mb-3">
                      {mod.moduleTitle}
                    </h3>
                    <ul className="space-y-2 pl-2">
                      {mod.topics.map((t, tIdx) => (
                        <li key={tIdx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
                Prerequisites & Requirements
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{course.prerequisites}</p>
            </div>
          </div>

          {/* Sticky Enrollment Sidebar */}
          <div className="space-y-6">
            <div className="card-flat p-6 space-y-6 bg-white/[0.03] border border-white/10 sticky top-24">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tuition Fee</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-white">
                    {formatNaira(course.priceNgn)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Flexible instalment plans available upon request.</p>
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <HiOutlineClock className="w-4 h-4 text-indigo-400" />
                  <span>Duration: <strong className="text-white">{course.duration}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <HiOutlineCalendar className="w-4 h-4 text-indigo-400" />
                  <span>Next Batch: <strong className="text-white">Contact us for dates</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <HiOutlineLocationMarker className="w-4 h-4 text-indigo-400" />
                  <span>Campus: <strong className="text-white">{siteConfig.campus} (or Virtual)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <HiOutlineAcademicCap className="w-4 h-4 text-indigo-400" />
                  <span>Accredited Certificate upon completion</span>
                </div>
              </div>

              <CourseEnrollAction course={course} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
