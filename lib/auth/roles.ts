import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

export function uniqueRoles(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((role): role is string => Boolean(role))))
}

export function getPortalPresentation(roles: string[]) {
  const assignedRoles = uniqueRoles(roles)
  const isAdmin = assignedRoles.includes("admin")
  const isLearner = !isAdmin && assignedRoles.includes("learner")
  const hasMultipleRoles = assignedRoles.length > 1
  const portalLabel = isAdmin
    ? "Admin Portal"
    : hasMultipleRoles
      ? "Multi-role Portal"
      : isLearner
        ? "Student Portal"
        : assignedRoles.length === 1
          ? {
              instructor: "Instructor Portal",
              startup_founder: "Founder Portal",
              business_owner: "Business Portal",
            }[assignedRoles[0]] ?? "Account Portal"
          : "Account Portal"

  return { isAdmin, isLearner, portalLabel }
}

/**
 * Resolves role names through the authoritative `user_roles -> role_id -> roles`
 * join. There is no `user_roles.role` column in the Phase 3 schema, so there is
 * nothing to fall back to.
 *
 * The caller passes the signed-in user's own client; the
 * "Users and admins can read user roles" RLS policy scopes rows to that user,
 * so no explicit user filter is applied here.
 */
export async function fetchCurrentRoleNames(
  supabase: SupabaseClient<Database>
): Promise<string[]> {
  const { data, error } = await supabase.from("user_roles").select("roles(name)")

  if (error) {
    console.error("Unable to resolve current role names:", error)
  }

  return uniqueRoles((data ?? []).map((row) => row.roles?.name))
}