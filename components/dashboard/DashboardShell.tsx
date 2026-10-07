import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/bookmarks", label: "Bookmarks" },
  { href: "/dashboard/certificates", label: "Certificates" },
  { href: "/dashboard/support", label: "Support" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

/**
 * Single role-filtered dashboard shell (Phase 2, 1.2) — not separate
 * Learner/Founder/Business dashboards. Widgets inside each route vary by
 * the signed-in user's role(s); the shell/nav stays the same for everyone.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid flex-grow-1 d-flex flex-column">
      <div className="row flex-grow-1">
        <aside className="col-12 col-md-3 col-lg-2 bg-navy py-4 px-0">
          <div className="px-3 mb-4">
            <Link href="/dashboard" className="fs-5 fw-semibold text-white">
              TallGate
            </Link>
          </div>
          <nav className="d-flex flex-column">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white text-opacity-75 px-3 py-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="col-12 col-md-9 col-lg-10 py-4">{children}</main>
      </div>
      <footer className="row border-top py-3">
        <div className="col-md-8 text-muted-tg small">
          © {new Date().getFullYear()} TallGate Limited. Learner &amp; Client
          Portal.
        </div>
        <nav
          className="col-md-4 d-flex justify-content-md-end gap-3 small"
          aria-label="Dashboard support links"
        >
          <Link href="/dashboard/support">Support</Link>
        </nav>
      </footer>
    </div>
  );
}
