import React from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { ADMIN_QUERY_LIMIT } from "@/lib/admin/queryLimits"
import PaymentsClient from "@/components/admin/PaymentsClient"

export const metadata = {
  title: "Payment Requests | TallGate Admin",
  description: "Record offline payments and confirm them before access is granted.",
}

type PaymentWithCourse = {
  id: string
  user_id: string | null
  course_id: string | null
  full_name: string
  email: string
  phone: string | null
  amount: number
  currency: string
  method: "bank_transfer" | "card" | "cash" | "other"
  reference: string | null
  status: "pending" | "confirmed" | "declined" | "refunded"
  note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  courses: { title: string } | null
}

export default async function AdminPaymentsPage() {
  let requests: PaymentWithCourse[] = []
  let courses: { id: string; title: string }[] = []
  let loadWarning = ""
  let loadFailed = false

  if (!isSupabaseConfigured()) {
    loadFailed = true
    loadWarning = "Payment requests are unavailable because Supabase is not configured."
  } else {
    const supabase = await createClient()

    const [{ data, error }, coursesResult] = await Promise.all([
      supabase
        .from("payment_requests")
        .select("*, courses(title)")
        .order("created_at", { ascending: false })
        .limit(ADMIN_QUERY_LIMIT),
      supabase.from("courses").select("id, title").order("title"),
    ])

    if (error) {
      loadFailed = true
      console.error("Error fetching payment requests:", error)
      loadWarning =
        "Payment requests could not be loaded. Check that the payment_requests migration has been applied."
    } else {
      requests = (data ?? []).map((item) => ({
        ...item,
        courses: item.courses ?? null,
      })) as PaymentWithCourse[]
      if (requests.length === ADMIN_QUERY_LIMIT) {
        loadWarning = `Showing the ${ADMIN_QUERY_LIMIT} most recent payment requests. Older records are not displayed, so the summary figures above may be incomplete.`
      }
    }

    if (coursesResult.error) {
      console.error("Error fetching courses for payments:", coursesResult.error)
      loadWarning = loadWarning
        ? `${loadWarning} The course list could not be loaded, so new requests cannot be linked to a course.`
        : "The course list could not be loaded, so new requests cannot be linked to a course."
    } else {
      courses = coursesResult.data ?? []
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Payment Requests</h1>
        <p className="text-sm text-slate-300 mt-1">
          Record offline payments, then confirm each one before a student is enrolled manually.
        </p>
      </div>

      {loadWarning && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900"
        >
          {loadWarning}
        </div>
      )}

      <PaymentsClient initialRequests={requests} courses={courses} loadFailed={loadFailed} />
    </div>
  )
}
