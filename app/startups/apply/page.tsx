import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { ApplicationForm } from "@/features/startups/components/ApplicationForm";
import { requireUser } from "@/lib/auth/requireUser";

export const metadata: Metadata = { title: "Apply — Startup Hub" };

export default async function StartupApplyPage() {
  await requireUser("/startups/apply");

  return (
    <>
      <PageHeader
        eyebrow="Startup Hub"
        title="Founder application"
        description="Tell us about what you're building. A real person reviews every application."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-2xl">
          <div className="site-panel rounded-2xl p-6 sm:p-8">
            <ApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
