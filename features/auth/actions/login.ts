"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/database/server";
import { isValidEmailAddress } from "@/lib/utils";

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
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!isValidEmailAddress(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!password || password.length > 128) {
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
