import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "System settings" };

export default function AdminSettingsPage() {
  return (
    <ComingSoon
      title="System settings"
      description="Management tooling for System settings ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
