"use client"

import React, { useMemo, useState } from "react"
import { formatNaira, formatShortDate, getErrorMessage } from "@/lib/utils"
import Pagination, { ADMIN_PAGE_SIZE } from "@/components/admin/Pagination"
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2"

type PaymentStatus = "pending" | "confirmed" | "declined" | "refunded"
type PaymentMethod = "bank_transfer" | "card" | "cash" | "other"

export type PaymentRequest = {
  id: string
  user_id: string | null
  course_id: string | null
  full_name: string
  email: string
  phone: string | null
  amount: number
  currency: string
  method: PaymentMethod
  reference: string | null
  status: PaymentStatus
  note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  courses: { title: string } | null
}

const STATUSES: PaymentStatus[] = ["pending", "confirmed", "declined", "refunded"]
const METHODS: PaymentMethod[] = ["bank_transfer", "card", "cash", "other"]

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  refunded: "Refunded",
}

function statusClasses(status: PaymentStatus) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200"
    case "declined":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-slate-100 text-slate-600 border-slate-200"
  }
}

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  course_id: "",
  amount: "",
  method: "bank_transfer" as PaymentMethod,
  reference: "",
  note: "",
}

export default function PaymentsClient({
  initialRequests,
  courses,
  loadFailed = false,
}: {
  initialRequests: PaymentRequest[]
  courses: { id: string; title: string }[]
  loadFailed?: boolean
}) {
  const [requests, setRequests] = useState<PaymentRequest[]>(initialRequests)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const stats = useMemo(() => {
    let pending = 0
    let confirmed = 0
    let declined = 0
    for (const request of requests) {
      if (request.status === "pending") pending += 1
      if (request.status === "declined") declined += 1
      if (request.status === "confirmed") confirmed += Number(request.amount) || 0
    }
    return { pending, confirmed, declined }
  }, [requests])

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    if (!matchesStatus) return false
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      request.full_name.toLowerCase().includes(query) ||
      request.email.toLowerCase().includes(query) ||
      (request.reference ?? "").toLowerCase().includes(query) ||
      (request.courses?.title ?? "").toLowerCase().includes(query)
    )
  })

  const pagedRequests = filteredRequests.slice(
    (page - 1) * ADMIN_PAGE_SIZE,
    page * ADMIN_PAGE_SIZE
  )

  const postAction = async (action: string, payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    })
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    if (!res.ok) throw new Error(getErrorMessage(data, "The payment request could not be saved."))
  }

  const handleStatusChange = async (request: PaymentRequest, nextStatus: PaymentStatus) => {
    if (pendingId || nextStatus === request.status) return
    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      pending: ["confirmed", "declined"],
      confirmed: ["refunded"],
      declined: ["confirmed"],
      refunded: [],
    }
    if (!(allowedTransitions[request.status] ?? []).includes(nextStatus)) return
    const previousRequests = [...requests]
    setPendingId(request.id)
    setError(null)
    setNotice(null)
    setRequests((current) =>
      current.map((entry) =>
        entry.id === request.id
          ? {
              ...entry,
              status: nextStatus,
              updated_at: new Date().toISOString(),
              reviewed_at:
                nextStatus === "confirmed" || nextStatus === "declined" || nextStatus === "refunded"
                  ? new Date().toISOString()
                  : entry.reviewed_at,
            }
          : entry
      )
    )
    try {
      await postAction("update_payment_status", { id: request.id, status: nextStatus })
      setNotice(`Marked ${request.full_name}'s payment as ${STATUS_LABELS[nextStatus].toLowerCase()}.`)
    } catch (err) {
      console.error("Payment status update failed:", err)
      setRequests(previousRequests)
      setError(getErrorMessage(err, "The payment status could not be updated."))
    } finally {
      setPendingId(null)
    }
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (form.full_name.trim().length < 2) {
      setCreateError("Customer name must be at least 2 characters.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || form.email.trim().length > 200) {
      setCreateError("Enter a valid email address.")
      return
    }
    if (!Number.isFinite(amount) || amount < 0 || amount > 99999999.99) {
      setCreateError("Amount must be between 0 and 99,999,999.99.")
      return
    }

    setIsSubmitting(true)
    setCreateError(null)
    try {
      await postAction("create_payment_request", {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        course_id: form.course_id || null,
        amount,
        method: form.method,
        reference: form.reference.trim(),
        note: form.note.trim(),
      })
      window.location.reload()
    } catch (err) {
      console.error("Payment request creation failed:", err)
      setCreateError(getErrorMessage(err, "The payment request could not be recorded."))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || notice}
        </p>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Awaiting confirmation
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.pending}</p>
          <p className="mt-1 text-xs text-slate-500">Pending payment requests</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Confirmed value
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNaira(stats.confirmed)}</p>
          <p className="mt-1 text-xs text-slate-500">Confirmed payments, not yet enrolments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Declined</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.declined}</p>
          <p className="mt-1 text-xs text-slate-500">Requests that did not pass review</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, reference, course..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PaymentStatus | "all")
              setPage(1)
            }}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(emptyForm)
            setCreateError(null)
            setIsModalOpen(true)
          }}
          className="btn-primary py-2 text-sm w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Record payment</span>
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Confirming a payment does not grant course access. Enrol the student from{" "}
        <span className="font-semibold text-slate-700">Student Enrollments</span> once payment is verified.
      </p>

      {/* Requests table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length > 0 ? (
                pagedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/50 transition-colors align-top">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatShortDate(request.created_at)}
                      {request.reviewed_at && (
                        <span className="block text-[11px] text-slate-400">
                          reviewed {formatShortDate(request.reviewed_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{request.full_name}</div>
                      <div className="text-xs text-slate-500">{request.email}</div>
                      {request.note && (
                        <div className="mt-1 max-w-[16rem] text-[11px] text-slate-500">{request.note}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {request.courses?.title ?? "—"}
                      <span className="mt-0.5 block text-[11px] uppercase tracking-wider text-slate-400">
                        {request.method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {formatNaira(request.amount)}
                      <span className="ml-1 text-[11px] font-normal text-slate-400">
                        {request.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-[10rem] break-words">
                      {request.reference || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClasses(request.status)}`}
                        >
                          {STATUS_LABELS[request.status]}
                        </span>
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request, e.target.value as PaymentStatus)}
                          disabled={pendingId !== null}
                          aria-label={`Status for ${request.full_name}`}
                          className="text-xs px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        {pendingId === request.id && (
                          <span className="text-xs text-slate-400">Saving...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    {loadFailed
                      ? "Payment request list unavailable."
                      : searchQuery || statusFilter !== "all"
                        ? "No payment requests match the current filters."
                        : "No payment requests have been recorded yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          total={filteredRequests.length}
          onPageChange={setPage}
          itemLabel="payment requests"
        />
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Record a payment request</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer name <span className="font-normal text-slate-500">(required)</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email <span className="font-normal text-slate-500">(required)</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  maxLength={40}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">No course linked</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (NGN) <span className="font-normal text-slate-500">(required)</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value as PaymentMethod })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    {METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference</label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Transfer reference or receipt number"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note</label>
                <textarea
                  maxLength={500}
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {createError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{createError}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost-light text-xs"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs" disabled={isSubmitting}>
                  {isSubmitting ? "Recording..." : "Record request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
