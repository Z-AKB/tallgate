import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { toCertificate, type AdminCertificate } from "@/lib/data/adminRowMappers"
import CertificatesClient from "@/components/admin/CertificatesClient"

export const metadata = {
  title: "Certificate Registry & Credential Issuance | TallGate Admin",
  description: "Generate and verify cryptographically verifiable graduation certificates.",
}

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ recipient?: string; course?: string }>
}) {
  const { recipient, course } = await searchParams
  let certificates: AdminCertificate[] = []
  let dataWarning = ""
  let loadFailed = false

  if (!isSupabaseConfigured()) {
    loadFailed = true
    dataWarning =
      "Certificate records are unavailable because Supabase is not configured."
  } else {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        loadFailed = true
        console.error("Unable to load certificate registry:", error)
        dataWarning =
          "Certificate records could not be loaded from Supabase. The list below may be incomplete."
      } else {
        certificates = (data ?? []).map(toCertificate)
      }
    } catch (error) {
      loadFailed = true
      console.error("Unable to load certificate registry:", error)
      dataWarning =
        "Certificate records could not be loaded from Supabase. The list below may be incomplete."
    }
  }

  return (
    <CertificatesClient
      initialCertificates={certificates}
      dataWarning={dataWarning}
      loadFailed={loadFailed}
      prefilledRecipient={recipient}
      prefilledCourse={course}
    />
  )
}