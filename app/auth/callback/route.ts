import { NextResponse } from "next/server";
import { createClient } from "@/lib/database/server";

/**
 * OAuth callback — exchanges the provider's auth code for a Supabase
 * session, then redirects into the app. Hit by Google/GitHub after the
 * user approves sign-in (see OAuthButtons' redirectTo).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  let redirectUrl = new URL("/dashboard", origin);
  try {
    const destination = new URL(next, origin);
    if (destination.origin === origin) redirectUrl = destination;
  } catch {
    console.warn("Invalid OAuth redirect target; using the dashboard.");
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
