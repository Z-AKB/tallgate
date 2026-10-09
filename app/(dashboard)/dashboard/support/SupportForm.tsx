"use client"

import { useState } from "react"
import { getErrorMessage } from "@/lib/utils"
import { HiCheckCircle, HiOutlineInformationCircle } from "react-icons/hi"

type DashboardSupportFormProps = {
  fullName: string
  email: string
  phone: string
}

export default function DashboardSupportForm({
  fullName,
  email,
  phone,
}: DashboardSupportFormProps) {
  const [formData, setFormData] = useState({
    fullName,
    email,
    phone,
    subject: "Account Portal Support",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "Failed to send support request."
        throw new Error(message)
      }
      setSubmitted(true)
    } catch (err: unknown) {
      console.error("Dashboard support request failed:", err)
      setError(getErrorMessage(err, "Failed to send support request."))
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div
        className="bg-white border border-emerald-200 rounded-xl p-8 sm:p-12 shadow-card text-center space-y-4"
        role="status"
      >
        <HiCheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          Support request sent
        </h2>
        <p className="text-sm text-slate-600">
          Our team will follow up with you at{" "}
          <span className="font-semibold">{formData.email}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false)
            setFormData((current) => ({ ...current, message: "" }))
          }}
          className="btn-secondary-light text-xs"
        >
          Send another request
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-card space-y-5"
    >
      <h2 className="text-lg font-bold text-slate-900">Contact Support</h2>

      {error && (
        <div
          className="p-3 bg-red-50 border border-red-200 text-status-danger rounded-lg text-sm flex items-center gap-2"
          role="alert"
        >
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="support-fullName" className="form-label">
            Full Name
          </label>
          <input
            id="support-fullName"
            name="fullName"
            type="text"
            required
            maxLength={120}
            value={formData.fullName}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            className="form-input text-sm py-2"
          />
        </div>
        <div>
          <label htmlFor="support-email" className="form-label">
            Email Address
          </label>
          <input
            id="support-email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            className="form-input text-sm py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="support-phone" className="form-label">
          Phone / WhatsApp (Optional)
        </label>
        <input
          id="support-phone"
          name="phone"
          type="tel"
          maxLength={40}
          value={formData.phone}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              phone: event.target.value,
            }))
          }
          className="form-input text-sm py-2"
        />
      </div>

      <div>
        <label htmlFor="support-message" className="form-label">
          How can we help?
        </label>
        <textarea
          id="support-message"
          name="message"
          rows={5}
          required
          maxLength={10000}
          value={formData.message}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              message: event.target.value,
            }))
          }
          placeholder="Describe the issue or question you need help with."
          className="form-input text-sm resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send support request"}
      </button>
    </form>
  )
}
