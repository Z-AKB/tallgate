"use client"

import { useState } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClock,
  HiCheckCircle,
  HiOutlineInformationCircle,
} from "react-icons/hi"
import { FaWhatsapp } from "react-icons/fa"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.")
      }

      setSubmitted(true)
    } catch (err: any) {
      console.error("Contact error:", err)
      setError(err.message || "Failed to send message.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Get in Touch with the TallGate Team"
          description="Whether you have an enterprise project to scope, wish to enroll in a training batch, or want to visit our physical campus in Abuja, we are here to assist."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Contact Channels & Location */}
          <div className="space-y-6">
            <div className="card-flat p-6 space-y-4 bg-white/[0.03] border border-white/10">
              <h3 className="text-base font-bold text-white tracking-tight">
                Abuja Campus & Headquarters
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <HiOutlineLocationMarker className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>No. 2 F.O. Eburuche Close, Gbazango Extension, Kubwa, Abuja, Nigeria</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <HiOutlinePhone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>+234 905 244 0452 / +234 705 286 9461</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <HiOutlineMail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>contact@tallgate.com / tallgatecomputingenterprise@gmail.com</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10">
                <a
                  href="https://wa.me/2349052440452"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center text-xs py-2.5 inline-flex items-center gap-2"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>Direct WhatsApp Chat</span>
                </a>
              </div>
            </div>

            <div className="card-flat p-6 space-y-3 bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2">
                <HiOutlineClock className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Campus & Office Hours
                </h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li className="flex justify-between">
                  <span>Monday – Friday:</span>
                  <span className="font-semibold text-white">8:00 AM – 6:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-semibold text-white">9:00 AM – 4:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday:</span>
                  <span className="text-slate-400">Closed (Virtual by Appt)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Message Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 shadow-card text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-status-success rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <HiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Message Sent Successfully
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. A member of the TallGate team will respond to <span className="font-semibold">{formData.email}</span> as soon as possible.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ fullName: "", email: "", phone: "", subject: "General Inquiry", message: "" })
                  }}
                  className="btn-secondary text-xs"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-card space-y-5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
                  Send a Direct Message
                </h3>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-status-danger rounded-lg text-xs flex items-center gap-2">
                    <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="Your full name"
                      className="form-input text-sm py-2"
                    />
                  </div>

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
                      placeholder="you@domain.com"
                      className="form-input text-sm py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+234 800 000 0000"
                      className="form-input text-sm py-2"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="form-label">
                      Inquiry Category *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="form-select text-xs py-2"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Enterprise Services">Enterprise Software & Consulting</option>
                      <option value="Academy Training & Admissions">Academy Training & Admissions</option>
                      <option value="Startup Hub Incubation">Startup Hub Incubation</option>
                      <option value="Campus Visit Appointment">Campus Visit Appointment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="form-label">
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we assist you? Please provide relevant details..."
                    className="form-input text-sm resize-y"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full sm:w-auto px-6 py-2.5 text-xs font-semibold disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Submit Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
