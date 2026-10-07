import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Startup applications" };

export default function AdminStartupsPage() {
  return (
    <ComingSoon
      title="Startup applications"
      description="Management tooling for Startup applications ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
