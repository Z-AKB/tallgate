import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockConsultations, MockConsultation } from "@/lib/data/adminMockData"
import { toConsultation } from "@/lib/data/adminRowMappers"
import InquiriesClient from "@/components/admin/InquiriesClient"

export const metadata = {
  title: "Consultation Queue & Scoping Leads | TallGate Admin",
  description: "Triage incoming enterprise technical scoping and consulting requests.",
}

export default async function AdminInquiriesPage() {
  const supabase = createClient()
  let consultations: MockConsultation[] = mockConsultations

  if (isSupabaseConfigured()) try {
    const { data } = await supabase
      .from("consultation_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      consultations = data.map(toConsultation)
    }
  } catch (err) {
    console.warn("Supabase consultation query fallback:", err)
  }

  return <InquiriesClient initialConsultations={consultations} />
}
