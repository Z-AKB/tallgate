import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockCertificates, MockCertificate } from "@/lib/data/adminMockData"
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
  const supabase = createClient()
  let certificates: MockCertificate[] = mockCertificates

  if (isSupabaseConfigured()) try {
    const { data, error } = await (supabase.from("certificates") as any)
      .select("*")
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      certificates = data
    }
  } catch (err) {
    console.warn("Supabase certificates fallback:", err)
  }

  return (
    <CertificatesClient
      initialCertificates={certificates}
      prefilledRecipient={searchParams?.recipient}
      prefilledCourse={searchParams?.course}
    />
  )
}
