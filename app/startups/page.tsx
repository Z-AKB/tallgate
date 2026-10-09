import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { EmptyState } from "@/components/marketing/EmptyState";

export const metadata: Metadata = { title: "Startup Hub" };

export default function StartupHubPage() {
  return (
    <>
      <PageHeader
        eyebrow="Startup Hub"
        title="Support for early-stage founders"
        description="Submit an application, get a real review, and track your status — no black-hole forms."
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/startups/apply" className="btn-primary px-6 py-3 text-base">
          Apply as a founder
        </Link>
      </section>

      <EmptyState
        title="No public startup profiles yet"
        description="Approved startups will be showcased here as founders complete the application and review process."
      />
    </>
  );
}
