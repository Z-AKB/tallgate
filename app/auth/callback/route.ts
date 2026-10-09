import { NextResponse } from "next/server";
import { createClient } from "@/lib/database/server";
import { safeNextPath } from "@/lib/auth/redirect";

/**
 * OAuth callback - exchanges the provider's auth code for a Supabase
 * session, then redirects into the app. Hit by Google/GitHub after the
 * user approves sign-in (see OAuthButtons' redirectTo).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next")) ?? "/dashboard";
  const redirectUrl = new URL(next, origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
