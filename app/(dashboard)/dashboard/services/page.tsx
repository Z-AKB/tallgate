"use client"

import { useState } from "react"
import Link from "next/link"
import { servicesData } from "@/lib/data/services"
import {
  HiOutlineBriefcase,
  HiOutlineCheck,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineCodeBracket,
  HiOutlineShieldCheck,
  HiOutlineCloud,
  HiOutlineDevicePhoneMobile,
} from "react-icons/hi2"

export default function UserServicesPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [inquiryNotes, setInquiryNotes] = useState("")

  const handleServiceInquiry = (serviceTitle: string) => {
    setSelectedService(serviceTitle)
    setSubmitted(false)
    setInquiryNotes("")
  }

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">
              <HiOutlineBriefcase className="w-4 h-4" />
              <span>Enterprise & Commercial Solutions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Our Other Services
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Complement your team or business with our specialized software engineering, cloud architecture, cybersecurity audits, and digital transformation capabilities.
            </p>
          </div>

          <Link href="/dashboard" className="btn-secondary text-xs self-start sm:self-auto">
            ← Back to Overview
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicesData.map((service) => (
          <div
            key={service.slug}
            className="card-base bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                  {service.category}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {service.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {service.shortDescription}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Key Deliverables
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {service.deliverables.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <HiOutlineCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => handleServiceInquiry(service.title)}
                className="btn-secondary w-full justify-center text-xs py-2"
              >
                Request Service Info
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Service Inquiry Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Request Service Info</h3>
                <p className="text-xs text-slate-500">{selectedService}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <HiOutlineCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Service Request Received</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Our enterprise solutions team will review your interest in <strong>{selectedService}</strong> and follow up directly via your account contact details.
                </p>
                <button
                  onClick={() => setSelectedService(null)}
                  className="btn-primary text-xs mt-3"
                >
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Requirements / Technical Scope (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={inquiryNotes}
                    onChange={(e) => setInquiryNotes(e.target.value)}
                    placeholder="Briefly describe what you'd like to achieve (e.g. mobile app launch, cybersecurity assessment, cloud migration)..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs flex items-center gap-1.5">
                    <HiOutlinePaperAirplane className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
