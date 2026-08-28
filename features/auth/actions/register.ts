"use server";

import { createClient } from "@/lib/database/server";

export interface RegisterState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * Signs up via Supabase Auth (email + password). Supabase sends the
 * verification email automatically (FR-5) — the app doesn't need its own
 * email step, just a page to send the user to (see /verify-email).
 */
export async function registerWithPassword(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { status: "error", message: "All fields are required." };
  }
  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "success",
    message: "Account created — check your email to verify before signing in.",
  };
}
