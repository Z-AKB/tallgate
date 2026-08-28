import { redirect } from "next/navigation";
import { createClient } from "@/lib/database/server";
import { requireUser } from "./requireUser";

/**
 * Admin guard — single flat `admin` role for MVP (per
 * tallgate-open-items-resolution.md, Section 1). Checks the user_roles
 * join table rather than a role column on profiles, so this doesn't need
 * to change when sub-roles (admin_content, admin_reviewer) are introduced
 * post-MVP.
 */
export async function requireAdmin(nextPath: string) {
  const user = await requireUser(nextPath);
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data) {
    redirect("/dashboard");
  }

  return user;
}
