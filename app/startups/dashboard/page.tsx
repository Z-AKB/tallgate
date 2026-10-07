import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/requireUser";

export const metadata: Metadata = { title: "Founder Dashboard" };

export default async function StartupDashboardPage() {
  await requireUser("/startups/dashboard");

  return (
    <>
      <PageHeader eyebrow="Startup Hub" title="Founder dashboard" />
      <ComingSoon
        title="Application status tracking"
        description="Once your application is submitted, its status (submitted, under review, approved) will update here in real time."
        backHref="/startups"
        backLabel="Back to Startup Hub"
      />
    </>
  );
}
