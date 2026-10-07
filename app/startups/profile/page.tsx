import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { requireUser } from "@/lib/auth/requireUser";

export const metadata: Metadata = { title: "Startup Profile" };

export default async function StartupProfilePage() {
  await requireUser("/startups/profile");

  return (
    <>
      <PageHeader eyebrow="Startup Hub" title="Startup profile" />
      <ComingSoon
        title="Available after approval"
        description="Your startup profile becomes editable once your application is approved."
        backHref="/startups"
        backLabel="Back to Startup Hub"
      />
    </>
  );
}
