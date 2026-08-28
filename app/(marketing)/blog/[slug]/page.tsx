import { notFound } from "next/navigation";

/**
 * No articles exist yet (see /blog), so every slug 404s honestly rather
 * than rendering fabricated content. Once articles are queried from
 * Supabase, this becomes a real detail page.
 */
export default function BlogDetailPage() {
  notFound();
}
