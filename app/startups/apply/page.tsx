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
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-7">
              <div className="card border p-4 p-md-5">
                <ApplicationForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
