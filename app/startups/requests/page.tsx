import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/requireUser";

export const metadata: Metadata = { title: "Mentorship Requests" };

export default async function StartupRequestsPage() {
  await requireUser("/startups/requests");

  return (
    <>
      <PageHeader eyebrow="Startup Hub" title="Mentorship & consultation requests" />
      <ComingSoon
        title="Request form coming soon"
        description="Submit requests for mentorship or consultation here — routed to Admin for follow-up."
        backHref="/startups"
        backLabel="Back to Startup Hub"
      />
    </>
  );
}
