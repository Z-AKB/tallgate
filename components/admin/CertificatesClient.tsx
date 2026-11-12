"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { AdminCertificate, type AdminCertificateType } from "@/lib/data/adminRowMappers"
import { formatCertificateIssueDate } from "@/lib/certificates/date"
import Pagination, { ADMIN_PAGE_SIZE } from "@/components/admin/Pagination"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowDownTray,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
} from "react-icons/hi2"
import { HiMail } from "react-icons/hi"

export default function CertificatesClient({
  initialCertificates,
  learners,
  courses,
  dataWarning,
  loadFailed = false,
  prefilledRecipient,
  prefilledCourse,
  prefilledCourseId,
  initialIssueDate,
}: {
  initialCertificates: AdminCertificate[]
  learners: Array<{ id: string; full_name: string; email: string }>
  courses: Array<{ id: string; title: string }>
  dataWarning: string
  loadFailed?: boolean
  prefilledRecipient?: string
  prefilledCourse?: string
  prefilledCourseId?: string
  initialIssueDate: string
}) {
  const [certificates, setCertificates] = useState<AdminCertificate[]>(initialCertificates)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(Boolean(prefilledRecipient))
  const [issueResult, setIssueResult] = useState<{
    verificationUrl: string
    qrCode: string
    downloadUrl: string
  } | null>(null)
  const [requestError, setRequestError] = useState("")

  const [learnerQuery, setLearnerQuery] = useState(prefilledRecipient || "")
  const [selectedLearner, setSelectedLearner] = useState<
    { id: string; full_name: string; email: string } | null
  >(null)
  const [certificateType, setCertificateType] = useState<AdminCertificateType>("course_linked")
  const [selectedCourseId, setSelectedCourseId] = useState(prefilledCourseId || "")
  const [certificateTitle, setCertificateTitle] = useState(prefilledCourse || "")
  const [issuanceReason, setIssuanceReason] = useState("")
  const [grade, setGrade] = useState("Distinction")
  const [issueDate, setIssueDate] = useState(initialIssueDate)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const filteredCertificates = certificates.filter((c) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      c.recipient_name.toLowerCase().includes(query) ||
      c.verification_code.toLowerCase().includes(query) ||
      c.certificate_number.toLowerCase().includes(query) ||
      c.course_title.toLowerCase().includes(query)
    )
  })

  const pagedCertificates = filteredCertificates.slice(
    (page - 1) * ADMIN_PAGE_SIZE,
    page * ADMIN_PAGE_SIZE
  )

  const matchingLearners = learners
    .filter((learner) => {
      const query = learnerQuery.trim().toLowerCase()
      return (
        !query ||
        learner.full_name.toLowerCase().includes(query) ||
        learner.email.toLowerCase().includes(query)
      )
    })
    .slice(0, 8)

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLearner) {
      setRequestError("Select an existing learner account.")
      return
    }
    if (certificateType === "course_linked" && !selectedCourseId) {
      setRequestError("Select the completed course this certificate is linked to.")
      return
    }
    if (certificateType === "independent" && !certificateTitle.trim()) {
      setRequestError("Enter a certificate title for independent manual issuance.")
      return
    }
    if (certificateType === "independent" && !issuanceReason.trim()) {
      setRequestError("A reason is required for independent manual certificates.")
      return
    }

    setIsSubmitting(true)
    setRequestError("")

    try {
      const response = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue_certificate",
          payload:
            certificateType === "course_linked"
              ? {
                  user_id: selectedLearner.id,
                  certificate_type: "course_linked",
                  course_id: selectedCourseId,
                  grade,
                  issue_date: issueDate,
                }
              : {
                  user_id: selectedLearner.id,
                  certificate_type: "independent",
                  course_title: certificateTitle.trim(),
                  reason: issuanceReason.trim(),
                  grade,
                  issue_date: issueDate,
                },
        }),
      })
      const result = (await response.json()) as {
        success?: boolean
        certificate?: AdminCertificate
        verification_url?: string
        qr_code?: string
        download_url?: string
        error?: string
      }

      const issuedCertificate = result.certificate
      if (!response.ok || !issuedCertificate || !result.verification_url) {
        throw new Error(result.error || "Certificate could not be issued.")
      }

      setCertificates((previous) => {
        if (previous.some((item) => item.id === issuedCertificate.id)) {
          return previous.map((item) =>
            item.id === issuedCertificate.id ? issuedCertificate : item
          )
        }
        return [issuedCertificate, ...previous]
      })
      setIssueResult({
        verificationUrl: result.verification_url,
        qrCode: result.qr_code ?? "",
        downloadUrl: result.download_url ?? "",
      })
      setIsSubmitting(false)
      setIsModalOpen(false)
      setLearnerQuery("")
      setSelectedLearner(null)
      setIssuanceReason("")
    } catch (error) {
      console.error("Error issuing certificate:", error)
      setRequestError(
        error instanceof Error ? error.message : "Certificate could not be issued."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleValidity = async (cert: AdminCertificate) => {
    const nextState = !cert.is_valid
    setRequestError("")

    try {
      const response = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_certificate_validity",
          payload: { id: cert.id, is_valid: nextState },
        }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error || "Certificate status could not be updated.")
      }
      setCertificates((previous) =>
        previous.map((item) =>
          item.id === cert.id ? { ...item, is_valid: nextState } : item
        )
      )
    } catch (error) {
      console.error("Error toggling validity:", error)
      setRequestError(
        error instanceof Error ? error.message : "Certificate status could not be updated."
      )
    }
  }

  const resendCertificateEmail = async (cert: AdminCertificate) => {
    setRequestError("")

    try {
      const response = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend_certificate_email",
          payload: { id: cert.id },
        }),
      })
      const result = (await response.json()) as { error?: string; success?: boolean }
      if (!response.ok) {
        throw new Error(result.error || "Email could not be resent.")
      }
      setCertificates((previous) =>
        previous.map((item) =>
          item.id === cert.id
            ? {
                ...item,
                email_status: "sent",
                email_sent_at: new Date().toISOString(),
                email_error: null,
                email_retry_count: (item.email_retry_count ?? 0) + 1,
              }
            : item
        )
      )
      setRequestError("Certificate email resent successfully.")
      setTimeout(() => setRequestError(""), 5000)
    } catch (error) {
      console.error("Error resending certificate email:", error)
      setRequestError(
        error instanceof Error ? error.message : "Email could not be resent."
      )
    }
  }

  return (
    <div className="space-y-6">
      {dataWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          {dataWarning}
        </div>
      )}
      {requestError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {requestError}
        </div>
      )}
      {issueResult && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center sm:flex-row sm:text-left">
          {issueResult.qrCode && (
            <Image
              src={issueResult.qrCode}
              alt="Certificate verification QR code"
              width={128}
              height={128}
              unoptimized
              className="h-32 w-32"
            />
          )}
          <div className="space-y-2">
            <h2 className="font-bold text-emerald-900">Certificate issued successfully</h2>
            <p className="text-xs text-emerald-800">
              {issueResult.qrCode
                ? "Scan the QR code or open the verification link."
                : "Open the verification link to confirm the certificate."}
            </p>
            <Link
              href={issueResult.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-xs font-semibold text-brand-primary underline"
            >
              {issueResult.verificationUrl}
            </Link>
            {issueResult.downloadUrl && (
              <Link
                href={issueResult.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 underline"
              >
                <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIssueResult(null)}
            className="ml-auto text-xs font-semibold text-slate-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Certificate Registry & Credential Issuance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Issue and cryptographically manage verifiable graduation credentials with unique hash lookup.
            </p>
          </div>
          <button
            onClick={() => {
              setRequestError("")
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by recipient, course, certificate number, or verification code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            {filteredCertificates.length} Certificates
          </span>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        {filteredCertificates.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Certificate Number</th>
                    <th className="px-6 py-4">Verification Code</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Course Program</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Email Status</th>
                    <th className="px-6 py-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-[11px]">
                          {cert.certificate_number}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-brand-primary bg-indigo-50 px-2 py-1 rounded border border-indigo-200 text-[11px]">
                          {cert.verification_code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">{cert.recipient_name}</p>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">{cert.course_title}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          title={cert.issuance_reason ?? undefined}
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            cert.certificate_type === "independent"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-indigo-200 bg-indigo-50 text-indigo-800"
                          }`}
                        >
                          {cert.certificate_type === "independent" ? "Independent" : "Course-linked"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {formatCertificateIssueDate(cert.issue_date)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {cert.grade}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleValidity(cert)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md transition-all ${cert.is_valid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                            : "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                            }`}
                        >
                          {cert.is_valid ? "Valid" : "Revoked"}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        {cert.email_status === "sent" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <HiMail className="w-3 h-3" />
                            <span>Sent</span>
                          </span>
                        )}
                        {cert.email_status === "sending" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <HiOutlineArrowPath className="w-3 h-3 animate-spin" />
                            <span>Sending...</span>
                          </span>
                        )}
                        {cert.email_status === "failed" && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              <HiOutlineExclamationCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                            {cert.email_retry_count !== null && cert.email_retry_count < 3 && (
                              <button
                                onClick={() => resendCertificateEmail(cert)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition-colors"
                                title="Resend certificate email"
                              >
                                <HiOutlineArrowPath className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            )}
                          </div>
                        )}
                        {cert.email_status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                            <HiMail className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {!cert.email_status && (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {cert.storage_path && (
                            <Link
                              href={`/api/admin/certificates/${cert.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-brand-primary hover:underline"
                            >
                              <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </Link>
                          )}
                          <Link
                            href={`/admin/verify?code=${encodeURIComponent(cert.verification_code)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                          >
                            <span>Verify Lookup</span>
                            <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={filteredCertificates.length}
              onPageChange={setPage}
              itemLabel="certificates"
            />
          </>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HiOutlineIdentification className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">
              {loadFailed ? "Registry Unavailable" : "No Certificates Found"}
            </h4>
            {!loadFailed && (
              <p className="text-xs text-slate-500">
                No certificates have been issued yet.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Issuance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                  TallGate Academy Credentials
                </span>
                <h3 className="text-lg font-bold text-slate-900">Issue Verifiable Certificate</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Learner Account:
                  <span className="ml-1 font-normal text-slate-500">(required)</span>
                </label>
                <input
                  type="search"
                  required
                  placeholder="Search learner by name or email"
                  value={selectedLearner ? `${selectedLearner.full_name} (${selectedLearner.email})` : learnerQuery}
                  onChange={(e) => {
                    setSelectedLearner(null)
                    setLearnerQuery(e.target.value)
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                />
                {selectedLearner ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    <span>{selectedLearner.full_name} · {selectedLearner.email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLearner(null)
                        setLearnerQuery("")
                      }}
                      className="font-semibold underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                    {matchingLearners.length > 0 ? matchingLearners.map((learner) => (
                      <button
                        key={learner.id}
                        type="button"
                        onClick={() => {
                          setSelectedLearner(learner)
                          setLearnerQuery("")
                        }}
                        className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-indigo-50"
                      >
                        <span className="block text-xs font-semibold text-slate-900">{learner.full_name}</span>
                        <span className="block text-[11px] text-slate-500">{learner.email}</span>
                      </button>
                    )) : (
                      <p className="px-3 py-2 text-xs text-slate-500">
                        {learners.length ? "No learner accounts match." : "No learner accounts are available."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <fieldset>
                <legend className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Certificate Type
                </legend>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Certificate type">
                  <button
                    type="button"
                    aria-pressed={certificateType === "course_linked"}
                    onClick={() => setCertificateType("course_linked")}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      certificateType === "course_linked"
                        ? "border-brand-primary bg-indigo-50 text-brand-primary"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Course-linked
                  </button>
                  <button
                    type="button"
                    aria-pressed={certificateType === "independent"}
                    onClick={() => setCertificateType("independent")}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      certificateType === "independent"
                        ? "border-brand-primary bg-indigo-50 text-brand-primary"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Independent manual
                  </button>
                </div>
              </fieldset>

              {certificateType === "course_linked" ? (
                <div>
                  <label
                    htmlFor="certificate-course"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1"
                  >
                    Completed Course:
                    <span className="ml-1 font-normal text-slate-500">(required)</span>
                  </label>
                  <select
                    id="certificate-course"
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Issuance is allowed only after the server verifies an active enrollment and
                    completion of all required activities. Learner-reported progress is never used.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="certificate-title"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1"
                    >
                      Certificate Title:
                      <span className="ml-1 font-normal text-slate-500">(required)</span>
                    </label>
                    <input
                      id="certificate-title"
                      type="text"
                      required
                      maxLength={200}
                      placeholder="Award or programme title"
                      value={certificateTitle}
                      onChange={(e) => setCertificateTitle(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="certificate-reason"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1"
                    >
                      Issuance Reason:
                      <span className="ml-1 font-normal text-slate-500">(required, audited)</span>
                    </label>
                    <textarea
                      id="certificate-reason"
                      required
                      maxLength={500}
                      rows={3}
                      placeholder="Explain why this certificate is being issued outside a course."
                      value={issuanceReason}
                      onChange={(e) => setIssuanceReason(e.target.value)}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      {issuanceReason.length}/500 · Stored on the certificate and in the admin audit log.
                    </p>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Graduation Grade:
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                  >
                    <option value="Distinction">Distinction</option>
                    <option value="Merit">Merit</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Issue Date:
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                A unique verification code and QR link will be generated securely when the certificate is issued.
              </p>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedLearner || learners.length === 0}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  {isSubmitting ? "Issuing..." : "Confirm & Issue Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
