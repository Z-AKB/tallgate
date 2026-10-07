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

      <section className="py-4">
        <div className="container">
          <Link href="/startups/apply" className="btn btn-primary btn-lg">
            Apply as a founder
          </Link>
        </div>
      </section>

      <EmptyState
        title="No public startup profiles yet"
        description="Approved startups will be showcased here as founders complete the application and review process."
      />
    </>
  );
}
