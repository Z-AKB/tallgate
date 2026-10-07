import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { EmptyState } from "@/components/marketing/EmptyState";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Articles from the TallGate team"
        description="Writing on technology, business, and building in Nigeria and West Africa."
      />
      <EmptyState
        title="No articles published yet"
        description="Our first posts are on the way. Check back soon."
      />
    </>
  );
}
