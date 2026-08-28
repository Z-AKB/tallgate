"use server";

import { createClient } from "@/lib/database/server";
import { requireUser } from "@/lib/auth/requireUser";

export interface ApplicationState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitStartupApplication(
  _prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const user = await requireUser("/startups/apply");

  const businessName = String(formData.get("business_name") ?? "").trim();
  const pitchSummary = String(formData.get("pitch_summary") ?? "").trim();

  if (!businessName || !pitchSummary) {
    return { status: "error", message: "Business name and pitch summary are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("startup_applications").insert({
    founder_id: user.id,
    business_name: businessName,
    pitch_summary: pitchSummary,
    status: "submitted",
  });

  if (error) {
    return {
      status: "error",
      message: "Something went wrong submitting your application. Please try again.",
    };
  }

  return {
    status: "success",
    message: "Application submitted — track its status from your dashboard.",
  };
}
