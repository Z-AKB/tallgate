import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockStartups, MockStartup } from "@/lib/data/adminMockData"
import { toStartup } from "@/lib/data/adminRowMappers"
import StartupsClient from "./StartupsClient"

export const metadata = {
  title: "Startup Incubation Pipeline | TallGate Admin",
  description: "Evaluate incoming tech startup applications, pitch decks, and incubation cohort admissions.",
}

export default async function AdminStartupsPage() {
  const supabase = createClient()
  let startups: MockStartup[] = mockStartups

  if (isSupabaseConfigured()) try {
    const { data } = await supabase
      .from("startup_applications")
      .select("*")
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      startups = data.map(toStartup)
    }
  } catch (err) {
    console.warn("Supabase startup query fallback:", err)
  }

  return <StartupsClient initialStartups={startups} />
}
