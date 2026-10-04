import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockConsultations, type MockConsultation } from "@/lib/data/adminMockData"
import { toConsultation } from "@/lib/data/adminRowMappers"
import InquiriesClient from "@/components/admin/InquiriesClient"

export const metadata = {
  title: "Consultation Queue & Scoping Leads | TallGate Admin",
  description: "Triage incoming enterprise technical scoping and consulting requests.",
}

export default async function AdminInquiriesPage() {
  const supabase = createClient()
  const useMockData = !isSupabaseConfigured() && process.env.NODE_ENV === "development"

  // Mock data is only ever a development placeholder for an unconfigured
  // project. Once Supabase answers, its result is authoritative even when it
  // is empty: a zero-row table must render as empty, never as seeded rows.
  let consultations: MockConsultation[] = useMockData ? mockConsultations : []
  let dataWarning = ""

  if (!isSupabaseConfigured()) {
    dataWarning = useMockData
      ? "Supabase is not configured, so this queue is showing sample data."
      : "Consultation records are unavailable because Supabase is not configured."
  } else {
    try {
      const { data, error } = await supabase
        .from("consultation_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Admin consultation query failed:", error)
        dataWarning = "Consultation requests could not be loaded. This queue may be incomplete."
      } else {
        consultations = (data ?? []).map(toConsultation)
      }
    } catch (err) {
      console.error("Admin consultation query failed:", err)
      dataWarning = "Consultation requests could not be loaded. This queue may be incomplete."
    }
  }

  return (
    <div className="space-y-6">
      {dataWarning && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          {dataWarning}
        </div>
      )}
      <InquiriesClient initialConsultations={consultations} />
    </div>
  )
}