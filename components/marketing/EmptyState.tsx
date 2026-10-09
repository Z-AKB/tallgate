interface EmptyStateProps {
  title: string;
  description: string;
}

/**
 * Honest empty state for content-driven pages (Portfolio, Blog, Events)
 * before real entries exist in the database. Deliberately does not
 * fabricate placeholder case studies, articles, or testimonials —
 * per project guidance, nothing on TallGate should look like real proof
 * that isn't.
 */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="site-panel mx-auto max-w-2xl rounded-2xl p-8 text-center sm:p-12">
        <h2 className="mb-2 text-lg font-semibold text-white sm:text-xl">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
