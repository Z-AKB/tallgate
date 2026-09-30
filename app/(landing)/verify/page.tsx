"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import SectionHeader from "@/components/ui/SectionHeader"
import {
  HiCheckCircle,
  HiOutlineSearch,
  HiXCircle,
} from "react-icons/hi"

interface VerificationCertificate {
  certificate_number: string
  recipient_name: string
  course_title: string
  issue_date: string
  grade: string | null
  status: "valid" | "revoked"
}

type LookupState = "idle" | "loading" | "valid" | "revoked" | "not_found" | "error"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [certificate, setCertificate] = useState<VerificationCertificate | null>(null)
  const [state, setState] = useState<LookupState>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const verifyCode = useCallback(async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase()
    if (!normalizedCode) return

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
    if (initialCode) {
      void verifyCode(initialCode)
    }
  }, [verifyCode])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void verifyCode(code)
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Verify TallGate Academy Certificates"
          description="Employers and institutions can verify the authenticity of any certificate or credential issued by TallGate Computing Enterprise."
        />

        <div className="card-base max-w-xl mx-auto space-y-6 border-white/10 bg-white/[0.03]">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Enter Certificate Verification Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter the code printed on the certificate"
                  className="form-input text-sm uppercase tracking-wider pl-10"
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
            <div className="pt-6 border-t border-white/10">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 text-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <HiCheckCircle className="w-5 h-5" />
                  <span>Valid Official Credential</span>
                </div>
                <CertificateDetails certificate={certificate} />
              </div>
            </div>
          )}

          {state === "revoked" && certificate && (
            <div className="pt-6 border-t border-white/10">
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-5 text-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <HiXCircle className="w-5 h-5" />
                  <span>Certificate Revoked</span>
                </div>
                <p className="text-sm text-amber-100">
                  This certificate was issued but is no longer valid.
                </p>
                <CertificateDetails certificate={certificate} />
              </div>
            </div>
          )}

          {state === "not_found" && (
            <div className="pt-6 border-t border-white/10">
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-5 text-center space-y-2">
                <HiXCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h2 className="text-sm font-bold text-white">Certificate Not Found</h2>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  No certificate was found matching code{" "}
                  <strong className="uppercase text-white">{code}</strong>.
                  Please check the code and try again.
                </p>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="pt-6 border-t border-white/10">
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-5 text-sm text-amber-100">
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
}: {
  certificate: VerificationCertificate
}) {
  return (
    <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
      <Detail label="Certificate Number" value={certificate.certificate_number} />
      <Detail label="Recipient Name" value={certificate.recipient_name} />
      <Detail label="Course / Track" value={certificate.course_title} />
      <Detail
        label="Issue Date"
        value={new Date(`${certificate.issue_date}T00:00:00`).toLocaleDateString()}
      />
      {certificate.grade && (
        <Detail label="Grade / Standing" value={certificate.grade} />
      )}
      <Detail label="Status" value={certificate.status === "valid" ? "Valid" : "Revoked"} />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="font-bold text-white text-sm mt-0.5">{value}</p>
    </div>
  )
}
