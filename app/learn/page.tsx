import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { EmptyState } from "@/components/marketing/EmptyState";

export const metadata: Metadata = { title: "Learning Hub" };

const CATEGORIES = [
  "Programming",
  "Web Development",
  "Mobile Development",
  "Networking",
  "Cybersecurity",
  "Cloud Computing",
  "AI",
  "Blockchain",
  "Business Technology",
] as const;

export default function LearnHomePage() {
  return (
    <>
      <PageHeader
        eyebrow="Learning Hub"
        title="Structured, practical courses for Nigerian and West African developers"
        description="Browse the catalogue below — no account needed until you're ready to enroll."
      />

      <section className="py-5">
        <div className="container">
          <h2 className="h5 fw-semibold text-navy mb-3">Categories</h2>
          <div className="d-flex flex-wrap gap-2 mb-5">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="badge bg-highlight text-navy border px-3 py-2 fw-normal"
              >
                {c}
              </span>
            ))}
          </div>
          <Link href="/learn/courses" className="btn btn-primary">
            Browse course catalogue
          </Link>
        </div>
      </section>

      <EmptyState
        title="Courses launching soon"
        description="The first courses are in development. Check back soon, or register to be notified at launch."
      />
    </>
  );
}
