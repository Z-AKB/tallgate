"use client"

import { useState } from "react"
import { CourseOffering } from "@/lib/data/courses"
import CourseEnrollModal from "@/features/learning/CourseEnrollModal"
import { FaWhatsapp } from "react-icons/fa"

export default function CourseEnrollAction({ course }: { course: CourseOffering }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="space-y-2 pt-4 border-t border-white/10">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary w-full justify-center text-sm py-3 font-semibold"
        >
          Apply for this Batch
        </button>
        <a
          href={`https://wa.me/2349052440452?text=Hello%2C%20I%20have%20questions%20about%20the%20${encodeURIComponent(course.title)}%20course`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full justify-center text-xs py-2.5 inline-flex items-center gap-2"
        >
          <FaWhatsapp className="w-4 h-4 text-emerald-400" />
          <span>Chat with Admissions</span>
        </a>
      </div>

      <CourseEnrollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={course}
      />
    </>
  )
}
