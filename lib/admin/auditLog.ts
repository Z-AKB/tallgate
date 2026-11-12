import { createAdminClient } from "@/lib/supabase/admin"
import { logError, logWarn } from "@/lib/logging/logger"
import type { Database } from "@/types/supabase"

type AdminAuditInsert = Database["public"]["Tables"]["admin_audit_log"]["Insert"]

export type AdminAuditOutcome = "success" | "failure"

/**
 * Payload keys, in priority order, that identify what an admin action acted on.
 * Only an opaque id is stored - never names, emails, or other free text.
 */
export const AUDIT_TARGET_KEYS = [
  "id",
  "user_id",
  "course_id",
  "certificate_id",
  "module_id",
  "lesson_id",
] as const

export function extractAuditTarget(payload: Record<string, unknown>): string | null {
  for (const key of AUDIT_TARGET_KEYS) {
    const value = payload[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim().slice(0, 200)
    }
  }
  return null
}

export function auditOutcomeFromStatus(status: number): AdminAuditOutcome {
  return status >= 200 && status < 300 ? "success" : "failure"
}

export type AdminAuditEntry = {
  actorId: string
  action: string
  target?: string | null
  outcome: AdminAuditOutcome
  details?: Record<string, unknown> | null
}

function sanitizeAuditDetails(
  details: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!details || typeof details !== "object") return null
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(details)) {
    if (!key || key.length > 64) continue
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = typeof value === "string" ? value.slice(0, 500) : value
    }
  }
  return Object.keys(out).length ? out : null
}

/**
 * Best-effort append to the admin audit log. An audit failure must never change
 * the outcome of the action the admin requested, so failures are logged (without
 * the row contents) and swallowed. The service-role client is used so entries
 * cannot be forged or blocked by RLS.
 */
export async function recordAdminAudit(entry: AdminAuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    const details = sanitizeAuditDetails(entry.details)
    const base: AdminAuditInsert = {
      actor_id: entry.actorId,
      action: entry.action.slice(0, 64),
      target: entry.target ? entry.target.slice(0, 200) : null,
      outcome: entry.outcome,
    }
    const row: AdminAuditInsert = details ? { ...base, details } : base

    const { error } = await supabase.from("admin_audit_log").insert(row)

    if (error && details && /details|column/i.test(error.message ?? "")) {
      const fallback = await supabase.from("admin_audit_log").insert(base)
      if (fallback.error) {
        logError("admin_audit.insert_failed", fallback.error, { code: fallback.error.code })
      }
      return
    }

    if (error) {
      logError("admin_audit.insert_failed", error, { code: error.code })
    }
  } catch {
    logWarn("admin_audit.client_unavailable")
  }
}
