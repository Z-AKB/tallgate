"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/database/server";

export interface LoginState {
  error?: string;
}

/**
 * Server Action for email/password sign-in. Runs server-side so the
 * Supabase server client can set the session cookie directly on the
 * response — a client-only sign-in wouldn't propagate the session to
 * server-rendered pages without an extra round trip.
 */
export async function loginWithPassword(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Deliberately generic — don't confirm whether the email exists.
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}
