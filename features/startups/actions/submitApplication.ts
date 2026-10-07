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

  const businessNameValue = formData.get("business_name");
  const pitchSummaryValue = formData.get("pitch_summary");
  const businessName =
    typeof businessNameValue === "string" ? businessNameValue.trim() : "";
  const pitchSummary =
    typeof pitchSummaryValue === "string" ? pitchSummaryValue.trim() : "";

  if (
    !businessName ||
    businessName.length > 160 ||
    !pitchSummary ||
    pitchSummary.length > 10_000
  ) {
    return {
      status: "error",
      message:
        "Provide a business name and pitch summary within the allowed length.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("startup_applications").insert({
    founder_id: user.id,
    business_name: businessName,
    pitch_summary: pitchSummary,
    status: "submitted",
  });

  if (error) {
    console.error("Startup application submission failed:", error);
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
