import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

/**
 * Placeholder for routes that exist in the locked sitemap but don't have
 * real functionality/data behind them yet. Used instead of a 404 so
 * navigation stays fully clickable while features are built out
 * milestone by milestone. Replace with real content as each area is built.
 */
export function ComingSoon({
  title,
  description,
  backHref = "/",
  backLabel = "Back to home",
}: ComingSoonProps) {
  return (
    <div className="container py-5 my-5">
      <div className="row justify-content-center text-center">
        <div className="col-lg-6">
          <p className="text-uppercase fw-semibold text-primary small mb-2">
            Coming soon
          </p>
          <h1 className="h2 fw-bold text-navy mb-3">{title}</h1>
          <p className="text-muted-tg mb-4">{description}</p>
          <Link href={backHref} className="btn btn-outline-primary">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
