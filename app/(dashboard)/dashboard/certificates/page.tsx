import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/guards"
import { formatCertificateIssueDate } from "@/lib/certificates/date"
import { HiOutlineIdentification } from "react-icons/hi2"

export const metadata = {
  title: "My Certificates | TallGate",
  description: "View and verify the certificates issued to your TallGate account.",
}

type LearnerCertificate = {
  id: string
  certificate_number: string
  verification_code: string
  course_title: string
  issue_date: string
  grade: string | null
  is_valid: boolean
}

export default async function DashboardCertificatesPage() {
  const user = await requireUser()
  let certificates: LearnerCertificate[] = []
  let loadFailed = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("certificates")
        .select("id, certificate_number, verification_code, course_title, issue_date, grade, is_valid")
        .eq("user_id", user.id)
        .order("issue_date", { ascending: false })

      if (error) {
        console.error("Unable to load learner certificates:", error)
        loadFailed = true
      } else {
        certificates = data ?? []
      }
    } catch (error) {
      console.error("Unable to load learner certificates:", error)
      loadFailed = true
    }
  } else {
    loadFailed = true
  }

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">
          <HiOutlineIdentification className="w-4 h-4" />
          <span>Credentials</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          My Certificates
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Certificates issued to your account. Each one has a public verification link you can share.
        </p>
      </div>

      {loadFailed ? (
        <div className="card-base bg-white border border-slate-200/80 shadow-sm text-center py-12 text-slate-500">
          <p className="text-sm font-semibold text-slate-700">Certificates unavailable</p>
          <p className="text-xs mt-1">Your certificates could not be loaded right now. Please try again later.</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="card-base bg-white border border-slate-200/80 shadow-sm text-center py-12 text-slate-500">
          <p className="text-sm font-semibold text-slate-700">No certificates yet</p>
          <p className="text-xs mt-1">Certificates appear here once an admin issues one for you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="card-base bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {certificate.certificate_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      certificate.is_valid
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {certificate.is_valid ? "Valid" : "Revoked"}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {certificate.course_title}
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Issued {formatCertificateIssueDate(certificate.issue_date)}
                    {certificate.grade ? ` · ${certificate.grade}` : ""}
                  </p>
                </div>
              </div>
              <Link
                href={`/verify?code=${encodeURIComponent(certificate.verification_code)}`}
                className="btn-secondary text-xs self-start"
              >
                View verification
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}