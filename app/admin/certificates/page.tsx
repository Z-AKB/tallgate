import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Certificates" };

export default function AdminCertificatesPage() {
  return (
    <ComingSoon
      title="Certificates"
      description="Management tooling for Certificates ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
