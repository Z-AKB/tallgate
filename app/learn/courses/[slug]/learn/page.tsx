import { notFound } from "next/navigation";

/**
 * Lesson player — gated to enrolled Learners once enrollment exists.
 * No courses exist yet, so every slug 404s.
 */
export default function LessonPlayerPage() {
  notFound();
}
