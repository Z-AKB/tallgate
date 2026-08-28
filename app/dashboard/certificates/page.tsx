import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Certificates" };

export default function DashboardCertificatesPage() {
  return (
    <ComingSoon
      title="Certificates"
      description="This section is built out alongside the Learning Hub and Startup Hub milestones."
      backHref="/dashboard"
      backLabel="Back to overview"
    />
  );
}
