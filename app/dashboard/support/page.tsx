import type { Metadata } from "next";
import { InquiryForm } from "@/features/inquiries/components/InquiryForm";

export const metadata: Metadata = { title: "Support" };

export default function DashboardSupportPage() {
  return (
    <div>
      <h1 className="h3 fw-bold text-navy mb-1">Support</h1>
      <p className="text-muted-tg mb-4">
        Send a support request to the TallGate team. We’ll follow up with you
        directly.
      </p>
      <div className="card border p-4 p-md-5">
        <InquiryForm supportOnly />
      </div>
    </div>
  );
}
