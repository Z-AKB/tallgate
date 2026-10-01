import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { mockMessages, MockMessage } from "@/lib/data/adminMockData"
import { toMessage } from "@/lib/data/adminRowMappers"
import MessagesClient from "@/components/admin/MessagesClient"

export const metadata = {
  title: "General Contact Inbox | TallGate Admin",
  description: "Review general enquiries, partnership proposals, and public communications.",
}

export default async function AdminMessagesPage() {
  const supabase = createClient()
  let messages: MockMessage[] = mockMessages

  if (isSupabaseConfigured()) try {
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (data && data.length > 0) {
      messages = data.map(toMessage)
    }
  } catch (err) {
    console.warn("Supabase contact messages fallback:", err)
  }

  return <MessagesClient initialMessages={messages} />
}
