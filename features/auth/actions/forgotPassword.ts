"use server";

import { createClient } from "@/lib/database/server";
import { isValidEmailAddress } from "@/lib/utils";

export interface ForgotPasswordState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";

  if (!isValidEmailAddress(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard/settings`,
  });

  if (error) {
    console.error("Password reset request failed:", error);
    return {
      status: "error",
      message: "Password reset is temporarily unavailable. Please try again later.",
    };
  }

  // Always return success, regardless of whether the email exists —
  // avoids leaking which addresses are registered.
  return {
    status: "success",
    message: "If an account exists for that email, a reset link is on its way.",
  };
}
