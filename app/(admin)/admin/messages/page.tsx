import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockMessages, type MockMessage } from "@/lib/data/adminMockData"
import { toMessage } from "@/lib/data/adminRowMappers"
import MessagesClient from "@/components/admin/MessagesClient"

export const metadata = {
  title: "General Contact Inbox | TallGate Admin",
  description: "Review general enquiries, partnership proposals, and public communications.",
}

export default async function AdminMessagesPage() {
  const supabase = createClient()
  const useMockData = !isSupabaseConfigured() && process.env.NODE_ENV === "development"

  // Mock data is only ever a development placeholder for an unconfigured
  // project. Once Supabase answers, its result is authoritative even when it
  // is empty: a zero-row table must render as empty, never as seeded rows.
  let messages: MockMessage[] = useMockData ? mockMessages : []
  let dataWarning = ""

  if (!isSupabaseConfigured()) {
    dataWarning = useMockData
      ? "Supabase is not configured, so this inbox is showing sample data."
      : "Messages are unavailable because Supabase is not configured."
  } else {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Admin contact messages query failed:", error)
        dataWarning = "Messages could not be loaded. This inbox may be incomplete."
      } else {
        messages = (data ?? []).map(toMessage)
      }
    } catch (err) {
      console.error("Admin contact messages query failed:", err)
      dataWarning = "Messages could not be loaded. This inbox may be incomplete."
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
      <MessagesClient initialMessages={messages} />
    </div>
  )
}