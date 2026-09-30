import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockCertificates, type MockCertificate } from "@/lib/data/adminMockData"
import CertificatesClient from "@/components/admin/CertificatesClient"

export const metadata = {
  title: "Certificate Registry & Credential Issuance | TallGate Admin",
  description: "Generate and verify cryptographically verifiable graduation certificates.",
}

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: { recipient?: string; course?: string }
}) {
  let certificates: MockCertificate[] = []
  let dataWarning = ""

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await (supabase.from("certificates") as any)
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Unable to load certificate registry:", error)
        dataWarning = "Certificate records could not be loaded from Supabase."
      } else {
        certificates = data ?? []
      }
    } catch (error) {
      console.error("Unable to load certificate registry:", error)
      dataWarning = "Certificate records could not be loaded from Supabase."
    }
  } else if (process.env.NODE_ENV === "development") {
    certificates = mockCertificates
    dataWarning = "Showing sample certificates. Configure Supabase to view live records."
  } else {
    dataWarning = "Certificate records are unavailable because Supabase is not configured."
  }

  return (
    <CertificatesClient
      initialCertificates={certificates}
      dataWarning={dataWarning}
      prefilledRecipient={searchParams?.recipient}
      prefilledCourse={searchParams?.course}
    />
  )
}
