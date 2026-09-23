"use client"

import React, { useState } from "react"
import Link from "next/link"
import { MockCertificate } from "@/lib/data/adminMockData"
import {
  HiOutlineMagnifyingGlass,
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlineCheckBadge,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineShieldCheck,
} from "react-icons/hi2"

const generateVerificationCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "TG-2026-"
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default function CertificatesClient({
  initialCertificates,
  prefilledRecipient,
  prefilledCourse,
}: {
  initialCertificates: MockCertificate[]
  prefilledRecipient?: string
  prefilledCourse?: string
}) {
  const [certificates, setCertificates] = useState<MockCertificate[]>(initialCertificates)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(Boolean(prefilledRecipient))

  // Form State
  const [recipientName, setRecipientName] = useState(prefilledRecipient || "")
  const [courseTitle, setCourseTitle] = useState(
    prefilledCourse || "Full-Stack Enterprise Cloud Engineering"
  )
  const [verificationCode, setVerificationCode] = useState(generateVerificationCode())
  const [grade, setGrade] = useState("Distinction")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCertificates = certificates.filter((c) => {
    return (
      c.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.verification_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course_title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recipientName || !courseTitle || !verificationCode) return

    setIsSubmitting(true)

    const newCert: MockCertificate = {
      id: `cert-${Date.now()}`,
      verification_code: verificationCode.toUpperCase(),
      recipient_name: recipientName,
      course_title: courseTitle,
      issue_date: issueDate,
      grade,
      is_valid: true,
      created_at: new Date().toISOString(),
    }

    // Optimistic UI update
    setCertificates((prev) => [newCert, ...prev])

    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue_certificate",
          payload: {
            recipient_name: recipientName,
            course_title: courseTitle,
            verification_code: verificationCode.toUpperCase(),
            grade,
            issue_date: issueDate,
          },
        }),
      })
    } catch (err) {
      console.error("Error issuing certificate:", err)
    } finally {
      setIsSubmitting(false)
      setIsModalOpen(false)
      setRecipientName("")
      setVerificationCode(generateVerificationCode())
    }
  }

  const toggleValidity = async (cert: MockCertificate) => {
    const nextState = !cert.is_valid
    setCertificates((prev) =>
      prev.map((c) => (c.id === cert.id ? { ...c, is_valid: nextState } : c))
    )

    try {
      await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_certificate_validity",
          payload: { id: cert.id, is_valid: nextState },
        }),
      })
    } catch (err) {
      console.error("Error toggling validity:", err)
    }
  }

  return (
    <div className="space-y-6">
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
              setVerificationCode(generateVerificationCode())
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-auto"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Issue New Certificate</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code (e.g. TG-2026-...) or recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Verification Hash</th>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Course Program</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
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

                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {cert.grade}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleValidity(cert)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-all ${
                          cert.is_valid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200"
                            : "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                        }`}
                      >
                        {cert.is_valid ? "Valid" : "Revoked"}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/verify?code=${encodeURIComponent(cert.verification_code)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
                      >
                        <span>Verify Lookup</span>
                        <HiOutlineArrowTopRightOnSquare className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <HiOutlineIdentification className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="text-sm font-bold text-slate-700">No Certificates Found</h4>
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
                  Recipient Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kelechi Onyema"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Course Program:
                </label>
                <select
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none"
                >
                  <option value="Full-Stack Enterprise Cloud Engineering">
                    Full-Stack Enterprise Cloud Engineering
                  </option>
                  <option value="Applied AI & Large Language Models in Production">
                    Applied AI & Large Language Models in Production
                  </option>
                  <option value="Cybersecurity Defense & Threat Intelligence">
                    Cybersecurity Defense & Threat Intelligence
                  </option>
                  <option value="Fintech Systems & Payment Infrastructure Design">
                    Fintech Systems & Payment Infrastructure Design
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Verification Code (Hash):
                  </label>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(generateVerificationCode())}
                    className="text-[11px] font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <HiOutlineArrowPath className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-primary focus:outline-none uppercase"
                />
              </div>

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
                  disabled={isSubmitting}
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
