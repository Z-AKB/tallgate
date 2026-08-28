import { notFound } from "next/navigation";

/**
 * No courses exist yet — every slug 404s honestly rather than rendering
 * fabricated course content. Becomes a real overview page once courses
 * are queried from Supabase.
 */
export default function CourseOverviewPage() {
  notFound();
}
