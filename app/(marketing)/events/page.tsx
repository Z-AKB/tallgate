import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { EmptyState } from "@/components/marketing/EmptyState";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Workshops and webinars"
        description="Live sessions on technology and business topics, open to the TallGate community."
      />
      <EmptyState
        title="No events scheduled yet"
        description="Upcoming workshops and webinars will be listed here."
      />
    </>
  );
}
