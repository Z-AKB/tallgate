"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import { formatNaira } from "@/lib/utils"
import { HiCheckCircle, HiOutlineInformationCircle } from "react-icons/hi"
import { FaWhatsapp } from "react-icons/fa"

interface CourseEnrollModalProps {
  isOpen: boolean
  onClose: () => void
  course: {
    title: string
    priceNgn?: number
    monthlyPriceNgn?: number
    duration?: string
    totalDuration?: string
  } | null
}

export default function CourseEnrollModal({ isOpen, onClose, course }: CourseEnrollModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    schedulePreference: "Weekday Morning (9:00 AM - 12:00 PM)",
    learningMode: "Virtual / Hybrid (Live Online)",
    notes: "",
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!course) return null

  const displayPrice = course.priceNgn ? formatNaira(course.priceNgn) : course.monthlyPriceNgn ? `${formatNaira(course.monthlyPriceNgn)}/mo` : "₦50,000"
  const displayDuration = course.duration || course.totalDuration || "8 Weeks"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          courseTitle: course.title,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit enrollment application.")
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error("Enrollment error:", err)
      setError(err.message || "Failed to submit enrollment application.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={submitted ? "Application Submitted" : "Enrollment Application"} maxWidth="md">
      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-status-success rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <HiCheckCircle className="w-7 h-7" />
          </div>
          <h4 className="text-xl font-bold text-slate-900">Application Received</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your application for <span className="font-semibold text-slate-900">{course.title}</span> has been received! Our admissions team will reach out via WhatsApp and email (<span className="font-semibold">{formData.email}</span>) with batch schedules and onboarding materials.
          </p>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`https://wa.me/2349052440452?text=Hello%20Admissions%2C%20I%20just%20enrolled%20for%20${encodeURIComponent(course.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center inline-flex items-center gap-2"
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>Connect with Admissions on WhatsApp</span>
            </a>
            <button onClick={handleClose} className="btn-secondary w-full">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-500 font-medium">Selected Program</p>
              <h5 className="text-sm font-bold text-slate-900 tracking-tight">{course.title}</h5>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-brand-navy">{displayPrice}</span>
              <p className="text-xs text-slate-500">{displayDuration}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-status-danger rounded-lg text-xs flex items-center gap-2">
              <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="form-label">
              Full Name *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Fatima Sani"
              className="form-input text-sm py-2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="email" className="form-label">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="fatima@gmail.com"
                className="form-input text-sm py-2"
              />
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone (WhatsApp) *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                className="form-input text-sm py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="schedulePreference" className="form-label">
                Batch Schedule *
              </label>
              <select
                id="schedulePreference"
                name="schedulePreference"
                value={formData.schedulePreference}
                onChange={handleChange}
                className="form-select text-xs py-2"
              >
                <option value="Weekday Morning (9:00 AM - 12:00 PM)">Weekday Morning (9am - 12pm)</option>
                <option value="Weekday Afternoon (1:00 PM - 4:00 PM)">Weekday Afternoon (1pm - 4pm)</option>
                <option value="Weekday Evening (5:00 PM - 7:30 PM)">Weekday Evening (5pm - 7:30pm)</option>
                <option value="Weekend Intensive (Sat & Sun)">Weekend Intensive (Sat & Sun)</option>
              </select>
            </div>

            <div>
              <label htmlFor="learningMode" className="form-label">
                Learning Format *
              </label>
              <select
                id="learningMode"
                name="learningMode"
                value={formData.learningMode}
                onChange={handleChange}
                className="form-select text-xs py-2"
              >
                <option value="In-Person Lab (Kubwa, Abuja)">In-Person Lab (Kubwa, Abuja)</option>
                <option value="Virtual / Hybrid (Live Online)">Virtual / Hybrid (Live Online)</option>
                <option value="Self-Paced Digital Track">Self-Paced Digital Track</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={handleClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-5 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Enrollment"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
