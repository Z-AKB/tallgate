import { redirect } from "next/navigation";
import { createClient } from "@/lib/database/server";

/**
 * Server-side auth guard for pages that require a signed-in user.
 * Redirects to /login with a `next` param so the person lands back where
 * they intended after signing in. This is a UX convenience only — actual
 * data access control is enforced by Postgres RLS (NFR-1), not by this
 * check alone.
 */
export async function requireUser(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
