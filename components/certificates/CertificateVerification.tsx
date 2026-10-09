"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import { formatCertificateIssueDate } from "@/lib/certificates/date"
import {
  HiCheckCircle,
  HiOutlineSearch,
  HiXCircle,
} from "react-icons/hi"

interface VerificationCertificate {
  certificate_number: string
  course_title: string
  issue_date: string
  status: "valid" | "revoked"
}

type LookupState = "idle" | "loading" | "valid" | "revoked" | "not_found" | "error"
type VerificationVariant = "public" | "dashboard" | "admin"

export default function CertificateVerification({
  variant = "public",
}: {
  variant?: VerificationVariant
}) {
  const [code, setCode] = useState("")
  const [certificate, setCertificate] = useState<VerificationCertificate | null>(null)
  const [state, setState] = useState<LookupState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const isDashboard = variant !== "public"

  const verifyCode = useCallback(async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase()
    if (!normalizedCode) {
      setCertificate(null)
      setErrorMessage("Enter a certificate verification code.")
      setState("error")
      return
    }

    setCode(normalizedCode)
    setCertificate(null)
    setErrorMessage("")
    setState("loading")

    try {
      const response = await fetch(
        `/api/verify?code=${encodeURIComponent(normalizedCode)}`
      )
      const data = (await response.json()) as {
        status?: LookupState
        certificate?: VerificationCertificate
        error?: string
      }

      if (
        response.ok &&
        data.certificate &&
        (data.status === "valid" || data.status === "revoked")
      ) {
        setCertificate(data.certificate)
        setState(data.status)
      } else if (response.status === 404 || data.status === "not_found") {
        setState("not_found")
      } else {
        setErrorMessage(data.error || "Verification is temporarily unavailable.")
        setState("error")
      }
    } catch (error) {
      console.error("Certificate verification request failed:", error)
      setErrorMessage("Verification is temporarily unavailable. Please try again.")
      setState("error")
    }
  }, [])

  useEffect(() => {
    const initialCode = new URLSearchParams(window.location.search).get("code")
    if (!initialCode) return

    const timer = setTimeout(() => void verifyCode(initialCode), 0)
    return () => clearTimeout(timer)
  }, [verifyCode])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void verifyCode(code)
  }

  return (
    <div className="py-8 sm:py-10">
      <div className="max-w-4xl mx-auto">
        {variant === "admin" ? (
          <div className="max-w-3xl mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Certificate Verification
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Look up a certificate by its verification code and confirm its current status.
            </p>
          </div>
        ) : isDashboard ? (
          <div className="max-w-3xl mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Verify Certificate
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Check the authenticity and current status of a TallGate Academy certificate.
            </p>
          </div>
        ) : (
          <SectionHeader
            title="Verify TallGate Academy Certificates"
            description="Employers and institutions can verify the authenticity of any certificate or credential issued by TallGate Academy."
          />
        )}

        <div
          className={`max-w-xl mx-auto space-y-6 rounded-xl ${
            isDashboard
              ? "bg-white border border-slate-200 p-6 sm:p-8 shadow-sm"
              : "card-base border-white/10 bg-white/[0.03]"
          }`}
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDashboard ? "text-slate-700" : "text-slate-300"
                }`}
              >
                Enter Certificate Verification Code
                <span
                  className={`ml-1 font-normal ${
                    isDashboard ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  (required)
                </span>
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter the code printed on the certificate"
                  className={`form-input text-sm uppercase tracking-wider pl-10 ${
                    isDashboard ? "border-slate-300 text-slate-900" : ""
                  }`}
                />
                <HiOutlineSearch className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={state === "loading"}
              className="btn-primary w-full justify-center text-sm py-2.5 font-semibold disabled:opacity-50"
            >
              {state === "loading" ? "Verifying Record..." : "Verify Certificate"}
            </button>
          </form>

          {state === "valid" && certificate && (
            <div className={`pt-6 border-t ${isDashboard ? "border-slate-200" : "border-white/10"}`}>
              <div
                className={`border border-emerald-500/30 rounded-xl p-5 space-y-3 ${
                  isDashboard
                    ? "bg-emerald-50 text-slate-900"
                    : "bg-emerald-950/40 text-slate-100"
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold text-sm ${
                    isDashboard ? "text-emerald-600" : "text-emerald-400"
                  }`}
                >
                  <HiCheckCircle className="w-5 h-5" />
                  <span>Valid Official Credential</span>
                </div>
                <CertificateDetails certificate={certificate} variant={variant} />
              </div>
            </div>
          )}

          {state === "revoked" && certificate && (
            <div className={`pt-6 border-t ${isDashboard ? "border-slate-200" : "border-white/10"}`}>
              <div
                className={`border border-amber-500/40 rounded-xl p-5 space-y-3 ${
                  isDashboard
                    ? "bg-amber-50 text-slate-900"
                    : "bg-amber-950/40 text-slate-100"
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold text-sm ${
                    isDashboard ? "text-amber-700" : "text-amber-300"
                  }`}
                >
                  <HiXCircle className="w-5 h-5" />
                  <span>Certificate Revoked</span>
                </div>
                <p className="text-sm">
                  This certificate was issued but is no longer valid.
                </p>
                <CertificateDetails certificate={certificate} variant={variant} />
              </div>
            </div>
          )}

          {state === "not_found" && (
            <div className={`pt-6 border-t ${isDashboard ? "border-slate-200" : "border-white/10"}`}>
              <div
                className={`border rounded-xl p-5 text-center space-y-2 ${
                  isDashboard
                    ? "bg-red-50 border-red-200"
                    : "bg-red-950/40 border-red-500/30"
                }`}
              >
                <HiXCircle
                  className={`w-8 h-8 mx-auto ${
                    isDashboard ? "text-rose-500" : "text-rose-400"
                  }`}
                />
                <h2 className={`text-sm font-bold ${isDashboard ? "text-slate-900" : "text-white"}`}>
                  Certificate Not Found
                </h2>
                <p className={`text-xs max-w-sm mx-auto ${isDashboard ? "text-slate-600" : "text-slate-300"}`}>
                  No certificate was found matching code{" "}
                  <strong className={`uppercase ${isDashboard ? "text-slate-900" : "text-white"}`}>
                    {code}
                  </strong>.
                  Please check the code and try again.
                </p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className={`pt-6 border-t ${isDashboard ? "border-slate-200" : "border-white/10"}`}>
              <div
                className={`border border-amber-500/30 rounded-xl p-5 text-sm ${
                  isDashboard
                    ? "bg-amber-50 text-amber-900"
                    : "bg-amber-950/40 text-amber-100"
                }`}
              >
                {errorMessage}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CertificateDetails({
  certificate,
  variant,
}: {
  certificate: VerificationCertificate
  variant: VerificationVariant
}) {
  const isDashboard = variant === "dashboard"
  return (
    <div
      className={`grid grid-cols-2 gap-3 text-xs pt-2 border-t ${
        isDashboard ? "border-slate-200" : "border-white/10"
      }`}
    >
      <Detail label="Certificate Number" value={certificate.certificate_number} variant={variant} />
      <Detail label="Course / Track" value={certificate.course_title} variant={variant} />
      <Detail
        label="Issue Date"
        value={formatCertificateIssueDate(certificate.issue_date)}
        variant={variant}
      />
      <Detail
        label="Status"
        value={certificate.status === "valid" ? "Valid" : "Revoked"}
        variant={variant}
      />
    </div>
  )
}

function Detail({
  label,
  value,
  variant,
}: {
  label: string
  value: string
  variant: VerificationVariant
}) {
  const isDashboard = variant === "dashboard"
  return (
    <div>
      <p className={`font-semibold uppercase tracking-wider ${isDashboard ? "text-slate-500" : "text-slate-400"}`}>
        {label}
      </p>
      <p className={`font-bold text-sm mt-0.5 ${isDashboard ? "text-slate-900" : "text-white"}`}>
        {value}
      </p>
    </div>
  )
}
