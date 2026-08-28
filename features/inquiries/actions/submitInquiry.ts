"use server";

import { createClient } from "@/lib/database/server";

export interface InquiryState {
  status: "idle" | "success" | "error";
  message?: string;
}

/**
 * Writes a row to contact_inquiries (Phase 3 schema). MVP scope per
 * tallgate-open-items-resolution.md: form-submission only, no live
 * calendar — Admin follows up manually from the unified /admin/inquiries
 * queue.
 */
export async function submitInquiry(
  _prevState: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const inquiryType = String(formData.get("inquiry_type") ?? "consultation");
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Name, email, and message are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_inquiries").insert({
    name,
    email,
    phone: phone || null,
    inquiry_type: inquiryType,
    message,
    status: "new",
  });

  if (error) {
    return {
      status: "error",
      message:
        "Something went wrong submitting your request. Please try again or email us directly.",
    };
  }

  return { status: "success", message: "Thanks — we'll be in touch shortly." };
}
