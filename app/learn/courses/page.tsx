import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { EmptyState } from "@/components/marketing/EmptyState";

export const metadata: Metadata = { title: "Course Catalogue" };

export default function CourseCataloguePage() {
  return (
    <>
      <PageHeader eyebrow="Learning Hub" title="Course catalogue" />
      <EmptyState
        title="No courses published yet"
        description="Once Instructors publish courses and Admin approves them, they'll appear here filterable by category."
      />
    </>
  );
}
