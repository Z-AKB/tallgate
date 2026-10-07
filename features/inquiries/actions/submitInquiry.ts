"use server";

import { createClient } from "@/lib/database/server";
import { isValidEmailAddress } from "@/lib/utils";

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
  const nameValue = formData.get("name");
  const emailValue = formData.get("email");
  const phoneValue = formData.get("phone");
  const inquiryTypeValue = formData.get("inquiry_type");
  const messageValue = formData.get("message");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const phone = typeof phoneValue === "string" ? phoneValue.trim() : "";
  const inquiryType =
    typeof inquiryTypeValue === "string" && inquiryTypeValue
      ? inquiryTypeValue
      : "consultation";
  const message = typeof messageValue === "string" ? messageValue.trim() : "";

  if (
    !name ||
    name.length > 120 ||
    !isValidEmailAddress(email) ||
    !message ||
    message.length > 10_000 ||
    phone.length > 40 ||
    !["consultation", "business_inquiry", "support"].includes(inquiryType)
  ) {
    return {
      status: "error",
      message:
        "Provide a valid name, email address, inquiry type, and message within the allowed length.",
    };
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
    console.error("Inquiry submission failed:", error);
    return {
      status: "error",
      message:
        "Something went wrong submitting your request. Please try again or email us directly.",
    };
  }

  return { status: "success", message: "Thanks — we'll be in touch shortly." };
}
