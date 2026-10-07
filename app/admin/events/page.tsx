import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Events" };

export default function AdminEventsPage() {
  return (
    <ComingSoon
      title="Events"
      description="Management tooling for Events ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
