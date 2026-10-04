import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockStartups, type MockStartup } from "@/lib/data/adminMockData"
import { toStartup } from "@/lib/data/adminRowMappers"
import StartupsClient from "./StartupsClient"

export const metadata = {
  title: "Startup Incubation Pipeline | TallGate Admin",
  description: "Evaluate incoming tech startup applications, pitch decks, and incubation cohort admissions.",
}

export default async function AdminStartupsPage() {
  const supabase = createClient()
  const useMockData = !isSupabaseConfigured() && process.env.NODE_ENV === "development"

  // Mock data is only ever a development placeholder for an unconfigured
  // project. Once Supabase answers, its result is authoritative even when it
  // is empty: a zero-row table must render as empty, never as seeded rows.
  let startups: MockStartup[] = useMockData ? mockStartups : []
  let dataWarning = ""

  if (!isSupabaseConfigured()) {
    dataWarning = useMockData
      ? "Supabase is not configured, so this pipeline is showing sample data."
      : "Startup applications are unavailable because Supabase is not configured."
  } else {
    try {
      const { data, error } = await supabase
        .from("startup_applications")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Admin startup query failed:", error)
        dataWarning = "Startup applications could not be loaded. This pipeline may be incomplete."
      } else {
        startups = (data ?? []).map(toStartup)
      }
    } catch (err) {
      console.error("Admin startup query failed:", err)
      dataWarning = "Startup applications could not be loaded. This pipeline may be incomplete."
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
      <StartupsClient initialStartups={startups} />
    </div>
  )
}