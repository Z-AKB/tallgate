"use client";

/**
 * OAuth sign-in (Google/GitHub). This runs client-side because
 * signInWithOAuth needs to redirect the browser to the provider, then back
 * to /auth/callback where the server exchanges the code for a session.
 */
import { createClient } from "@/lib/database/client";

const PROVIDERS = [
  { id: "google", label: "Continue with Google" },
  { id: "github", label: "Continue with GitHub" },
] as const;

export function OAuthButtons() {
  async function handleOAuth(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="d-grid gap-2">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => handleOAuth(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
