import { notFound } from "next/navigation";

/**
 * No events exist yet (see /events), so every slug 404s honestly rather
 * than rendering fabricated content. Once events are queried from
 * Supabase, this becomes a real detail page.
 */
export default function EventDetailPage() {
  notFound();
}
