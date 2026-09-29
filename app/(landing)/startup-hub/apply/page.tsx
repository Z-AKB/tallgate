"use client"

import { useState } from "react"
import Link from "next/link"
import SectionHeader from "@/components/ui/SectionHeader"
import { HiCheckCircle, HiOutlineInformationCircle, HiOutlineArrowLeft } from "react-icons/hi"
import { FaWhatsapp } from "react-icons/fa"

export default function StartupApplyPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    founderName: "",
    email: "",
    phone: "",
    industry: "Fintech & Financial Services",
    stage: "mvp",
    problemStatement: "",
    solutionDescription: "",
    pitchDeckUrl: "",
    supportNeeded: ["Technical Architecture", "MVP Development"],
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const industryOptions = [
    "Fintech & Financial Services",
    "Logistics & Supply Chain",
    "Healthtech & Telemedicine",
    "Edtech & Skills Training",
    "Agritech & Food Security",
    "B2B SaaS & Enterprise Tools",
    "E-commerce & Retail Tech",
    "Other"
  ]

  const supportCheckboxes = [
    "Technical Architecture",
    "MVP Development",
    "Fractional CTO Advisory",
    "Security & NDPR Audit",
    "Investor Readiness & Pitch Deck",
    "Corporate Pilot Introductions"
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSupportToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.supportNeeded.includes(item)
      if (exists) {
        return { ...prev, supportNeeded: prev.supportNeeded.filter((s) => s !== item) }
      } else {
        return { ...prev, supportNeeded: [...prev.supportNeeded, item] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/startups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit startup application.")
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error("Startup application error:", err)
      setError(err.message || "Failed to submit application.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/startup-hub"
          prefetch={true}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          <span>Back to Startup Hub Overview</span>
        </Link>

        <SectionHeader
          title="Apply for TallGate Startup Incubation"
          description="Tell us about what you are building. Accepted founders work closely with our lead engineers to accelerate product development and venture readiness."
        />

        {submitted ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 shadow-card text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-status-success rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <HiCheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Application Submitted Successfully
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{formData.founderName}</span>. Our startup evaluation committee meets weekly to review applications for <span className="font-semibold text-slate-900">{formData.companyName}</span>. We will follow up via email (<span className="font-semibold">{formData.email}</span>) with feedback or an interview invitation.
            </p>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/2349131898566?text=Hello%20TallGate%20Startup%20Hub%2C%20I%20just%20submitted%20an%20incubation%20application%20for%20${encodeURIComponent(formData.companyName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <FaWhatsapp className="w-4 h-4" />
                <span>Notify Admissions on WhatsApp</span>
              </a>
              <Link href="/startup-hub" className="btn-secondary w-full sm:w-auto">
                Return to Hub
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-card space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-status-danger rounded-lg text-sm flex items-center gap-2">
                <HiOutlineInformationCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Company & Founder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="companyName" className="form-label">
                  Startup / Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. PayFlow Technologies"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="founderName" className="form-label">
                  Lead Founder&apos;s Full Name
                </label>
                <input
                  id="founderName"
                  name="founderName"
                  type="text"
                  required
                  value={formData.founderName}
                  onChange={handleChange}
                  placeholder="e.g. Emeka Okafor"
                  className="form-input"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="email" className="form-label">
                  Founder Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="founder@company.com"
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="phone" className="form-label">
                  Phone (WhatsApp)
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
            </div>

            {/* Industry & Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="industry" className="form-label">
                  Primary Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="form-select"
                >
                  {industryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stage" className="form-label">
                  Current Company Stage
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="idea">Idea Stage / Conceptual</option>
                  <option value="prototype">Prototype / Wireframe Ready</option>
                  <option value="mvp">Functional MVP (Testing with users)</option>
                  <option value="early_revenue">Early Revenue (Commercial Traction)</option>
                  <option value="scaling">Scaling / Growth Stage</option>
                </select>
              </div>
            </div>

            {/* Problem Statement */}
            <div>
              <label htmlFor="problemStatement" className="form-label">
                The Problem You Are Solving
              </label>
              <textarea
                id="problemStatement"
                name="problemStatement"
                rows={3}
                required
                value={formData.problemStatement}
                onChange={handleChange}
                placeholder="What specific pain point or operational inefficiency in Africa does your startup address? Who experiences this pain?"
                className="form-input resize-y"
              />
            </div>

            {/* Solution Description */}
            <div>
              <label htmlFor="solutionDescription" className="form-label">
                Your Proposed Technology Solution
              </label>
              <textarea
                id="solutionDescription"
                name="solutionDescription"
                rows={3}
                required
                value={formData.solutionDescription}
                onChange={handleChange}
                placeholder="How does your platform solve this problem? What is the core value proposition?"
                className="form-input resize-y"
              />
            </div>

            {/* Pitch Deck URL */}
            <div>
              <label htmlFor="pitchDeckUrl" className="form-label">
                Pitch Deck / Product Demo Link (Google Drive / DocSend / Loom)
              </label>
              <input
                id="pitchDeckUrl"
                name="pitchDeckUrl"
                type="url"
                value={formData.pitchDeckUrl}
                onChange={handleChange}
                placeholder="https://drive.google.com/... or https://docsend.com/..."
                className="form-input"
              />
            </div>

            {/* Support Needed Checkboxes */}
            <div>
              <label className="form-label mb-2">
                What Areas Do You Need Support In?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {supportCheckboxes.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.supportNeeded.includes(item)}
                      onChange={() => handleSupportToggle(item)}
                      className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4"
                    />
                    <span className="text-xs text-slate-800 font-medium">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full sm:w-auto px-8 py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
              >
                {loading ? "Submitting Application..." : "Submit Startup Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
