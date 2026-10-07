import { notFound } from "next/navigation";

/**
 * No portfolio entries exist yet (see /portfolio), so every slug 404s
 * honestly rather than rendering fabricated content. Once projects are
 * queried from Supabase, this becomes a real detail page.
 */
export default function PortfolioDetailPage() {
  notFound();
}
