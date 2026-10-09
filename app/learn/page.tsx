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

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Categories</h2>
        <div className="mb-8 flex flex-wrap gap-2.5">
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-md border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200"
            >
              {c}
            </span>
          ))}
        </div>
        <Link
          href="/learn/courses"
          className="btn-primary px-6 py-3 text-sm"
        >
          Browse course catalogue
        </Link>
      </section>

      <EmptyState
        title="Courses launching soon"
        description="The first courses are in development. Check back soon, or register to be notified at launch."
      />
    </>
  );
}
