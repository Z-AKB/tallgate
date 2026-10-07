import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Projects" };

export default function AdminProjectsPage() {
  return (
    <ComingSoon
      title="Projects"
      description="Management tooling for Projects ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
