import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Courses" };

export default function AdminCoursesPage() {
  return (
    <ComingSoon
      title="Courses"
      description="Management tooling for Courses ships alongside the milestone that produces this content."
      backHref="/admin"
      backLabel="Back to admin dashboard"
    />
  );
}
