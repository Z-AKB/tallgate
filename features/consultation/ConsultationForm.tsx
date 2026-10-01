"use client"

import { useState, Suspense } from "react"
import { getErrorMessage } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { HiCheckCircle, HiArrowRight, HiOutlineInformationCircle } from "react-icons/hi"
import { FaWhatsapp } from "react-icons/fa"

function ConsultationFormContent({ preselectedService = "" }: { preselectedService?: string }) {
  const searchParams = useSearchParams()
  const serviceFromQuery = searchParams.get("service") || preselectedService

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    serviceInterest: serviceFromQuery || "Custom Software Development",
    projectScope: "",
    budgetRange: "₦1.5M - ₦5M",
    timeline: "1 - 2 Months",
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serviceOptions = [
    "Custom Software Development",
    "Web & Mobile Engineering",
    "Cloud & DevOps Infrastructure",
    "Cybersecurity & NDPR Compliance",
    "AI & Business Process Automation",
    "Technical Architecture & Advisory",
    "Corporate Tech Training",
    "Other / General Inquiry"
  ]

  const budgetOptions = [
    "Under ₦500,000",
    "₦500,000 - ₦1,500,000",
    "₦1,500,000 - ₦5,000,000",
    "₦5,000,000 - ₦15,000,000",
    "Enterprise / ₦15M+",
    "Not sure / Need assessment"
  ]

  const timelineOptions = [
    "Immediate (within 2 weeks)",
    "1 - 2 Months",
    "3 - 6 Months",
    "Exploratory / Planning Stage"
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit consultation request.")
      }

      setSubmitted(true)
    } catch (err: unknown) {
      console.error("Consultation submission error:", err)
      setError(getErrorMessage(err, "An unexpected error occurred. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-card text-center max-w-xl mx-auto">
        <div className="w-14 h-14 bg-emerald-50 text-status-success rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <HiCheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Consultation Request Received
        </h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Thank you, <span className="font-semibold text-slate-900">{formData.fullName}</span>. Our team is reviewing your project details and will reach out via email (<span className="font-semibold">{formData.email}</span>) or phone as soon as possible.
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={`https://wa.me/2349131898566?text=Hello%20TallGate%2C%20I%20just%20submitted%20a%20consultation%20request%20for%20${encodeURIComponent(formData.serviceInterest)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="w-4 h-4" />
            <span>Fast-track via WhatsApp</span>
          </a>
          <button
            onClick={() => {
              setSubmitted(false)
              setFormData({
                fullName: "",
                email: "",
                phone: "",
                companyName: "",
                serviceInterest: "Custom Software Development",
                projectScope: "",
                budgetRange: "₦1.5M - ₦5M",
                timeline: "1 - 2 Months",
              })
            }}
            className="btn-secondary w-full sm:w-auto"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-card space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-status-danger rounded-lg text-sm flex items-start gap-3">
          <HiOutlineInformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="fullName" className="form-label">
            Your Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Ibrahim Musa"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="email" className="form-label">
            Work Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="ibrahim@company.com"
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="phone" className="form-label">
            Phone / WhatsApp Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="+234 800 000 0000"
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="companyName" className="form-label">
            Company / Organization (Optional)
          </label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="Apex Logistics Ltd"
            className="form-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-1">
          <label htmlFor="serviceInterest" className="form-label">
            Primary Area of Interest
          </label>
          <select
            id="serviceInterest"
            name="serviceInterest"
            value={formData.serviceInterest}
            onChange={handleChange}
            className="form-select"
          >
            {serviceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="budgetRange" className="form-label">
            Estimated Budget (NGN)
          </label>
          <select
            id="budgetRange"
            name="budgetRange"
            value={formData.budgetRange}
            onChange={handleChange}
            className="form-select"
          >
            {budgetOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="timeline" className="form-label">
            Desired Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="form-select"
          >
            {timelineOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="projectScope" className="form-label">
          Project Scope & Objectives
        </label>
        <textarea
          id="projectScope"
          name="projectScope"
          rows={4}
          required
          value={formData.projectScope}
          onChange={handleChange}
          placeholder="Briefly describe what you're looking to build, solve, or automate. Mention any existing systems or technology preferences..."
          className="form-input resize-y"
        />
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>🔒 We handle submitted details with care and confidentiality.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto px-8 py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
        >
          {loading ? "Submitting Request..." : "Request Technical Consultation"}
        </button>
      </div>
    </form>
  )
}

export default function ConsultationForm({ preselectedService = "" }: { preselectedService?: string }) {
  return (
    <Suspense fallback={<div className="card-base p-8 text-center text-slate-400 text-sm animate-pulse">Loading consultation form...</div>}>
      <ConsultationFormContent preselectedService={preselectedService} />
    </Suspense>
  )
}

