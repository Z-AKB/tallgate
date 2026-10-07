import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Articles" };

export default function AdminArticlesPage() {
  return (
    <ComingSoon
      title="Articles"
      description="Management tooling for Articles ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
