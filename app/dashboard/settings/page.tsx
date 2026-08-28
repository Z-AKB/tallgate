import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Settings" };

export default function DashboardSettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="This section is built out alongside the Learning Hub and Startup Hub milestones."
      backHref="/dashboard"
      backLabel="Back to overview"
    />
  );
}
