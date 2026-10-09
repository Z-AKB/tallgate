"use server";

import { createClient } from "@/lib/database/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? "";
  const founderName =
    profile?.full_name?.trim() || email.split("@")[0] || "Applicant";

  // Direct PostgREST inserts into startup_applications are revoked from
  // authenticated users and granted only to service_role, so the validated,
  // authenticated submission uses the trusted server client for the write.
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("Startup application admin client unavailable:", error);
    return {
      status: "error",
      message: "Something went wrong submitting your application. Please try again.",
    };
  }

  const { error } = await admin.from("startup_applications").insert({
    user_id: user.id,
    company_name: businessName,
    founder_name: founderName,
    email,
    phone: profile?.phone ?? "",
    industry: "other",
    stage: "idea",
    problem_statement: pitchSummary,
    solution_description: pitchSummary,
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
