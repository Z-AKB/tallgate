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
    <div className="container py-5">
      <div className="row justify-content-center text-center py-5">
        <div className="col-lg-6">
          <h2 className="h4 fw-semibold text-navy mb-2">{title}</h2>
          <p className="text-muted-tg mb-0">{description}</p>
        </div>
      </div>
    </div>
  );
}
