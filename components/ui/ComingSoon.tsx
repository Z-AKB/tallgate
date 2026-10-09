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
    <div className="site-shell flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-indigo-300 sm:text-sm">
        Coming soon
      </p>
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h1>
      <p className="mb-6 max-w-xl text-base leading-relaxed text-slate-300">
        {description}
      </p>
      <Link href={backHref} className="btn-secondary">
        {backLabel}
      </Link>
    </div>
  );
}
