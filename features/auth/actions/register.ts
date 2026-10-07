"use server";

import { createClient } from "@/lib/database/server";
import { isValidEmailAddress } from "@/lib/utils";

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
  const fullNameValue = formData.get("full_name");
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const fullName = typeof fullNameValue === "string" ? fullNameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!fullName || !email || !password) {
    return { status: "error", message: "All fields are required." };
  }
  if (fullName.length > 120) {
    return { status: "error", message: "Name must be no more than 120 characters." };
  }
  if (!isValidEmailAddress(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
    };
  }
  if (password.length > 128) {
    return {
      status: "error",
      message: "Password must be no more than 128 characters.",
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
