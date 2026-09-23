"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SectionHeader from "@/components/ui/SectionHeader"
import { HiOutlineAcademicCap, HiOutlineSearch, HiCheckCircle, HiXCircle } from "react-icons/hi"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code.trim().toUpperCase())}`)
      const data = await res.json()
      if (res.ok && data.certificate) {
        setResult(data.certificate)
      } else {
        setResult(null)
      }
    } catch (err) {
      console.error("Verification lookup error:", err)
      setResult(null)
    } finally {
      setLoading(false)
    }
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
              <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Enter Certificate Verification Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. TG-2024-9182"
                  className="form-input text-sm uppercase tracking-wider pl-10"
                />
                <HiOutlineSearch className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-sm py-2.5 font-semibold disabled:opacity-50"
            >
              {loading ? "Verifying Record..." : "Verify Certificate"}
            </button>
          </form>

          {/* Verification Result */}
          {searched && (
            <div className="pt-6 border-t border-white/10">
              {result ? (
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 text-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <HiCheckCircle className="w-5 h-5" />
                    <span>Valid Official Credential</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-emerald-500/20">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider">Recipient Name</p>
                      <p className="font-bold text-white text-sm mt-0.5">{result.recipient_name}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider">Course / Track</p>
                      <p className="font-bold text-white text-sm mt-0.5">{result.course_title}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider">Issue Date</p>
                      <p className="text-slate-200 mt-0.5">{result.issue_date}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider">Grade / Standing</p>
                      <p className="text-slate-200 mt-0.5">{result.grade || "Distinction"}</p>
                    </div>
                  </div>

                  <div className="pt-2 text-xs text-slate-400 border-t border-emerald-500/20 flex justify-between items-center">
                    <span>Code: <strong className="text-white">{result.verification_code}</strong></span>
                    <span className="text-emerald-400 font-medium">TallGate Academy Registry</span>
                  </div>
                </div>
              ) : (
                <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-5 text-center space-y-2">
                  <HiXCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Certificate Not Found</h4>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    No active credential was found matching code <strong className="uppercase text-white">{code}</strong>. Please check the spelling or contact academic registry.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
