"use server";

import { createClient } from "@/lib/database/server";

export interface ForgotPasswordState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { status: "error", message: "Enter your email." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard/settings`,
  });

  // Always return success, regardless of whether the email exists —
  // avoids leaking which addresses are registered.
  return {
    status: "success",
    message: "If an account exists for that email, a reset link is on its way.",
  };
}
