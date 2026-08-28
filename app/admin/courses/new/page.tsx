import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "New Course" };

export default function AdminNewCoursePage() {
  return (
    <ComingSoon
      title="Course creation"
      description="Course/module/lesson authoring ships with the Learning Hub milestone."
      backHref="/admin/courses"
      backLabel="Back to courses"
    />
  );
}
