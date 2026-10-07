import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { EmptyState } from "@/components/marketing/EmptyState";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Projects and case studies"
        description="A record of what we've built, published as work is completed and case studies are ready to share."
      />
      <EmptyState
        title="No projects published yet"
        description="Case studies go live here as engagements wrap up. Check back soon, or get in touch to discuss a project."
      />
    </>
  );
}
