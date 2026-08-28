import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/bookmarks", label: "Bookmarks" },
  { href: "/dashboard/certificates", label: "Certificates" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

/**
 * Single role-filtered dashboard shell (Phase 2, 1.2) — not separate
 * Learner/Founder/Business dashboards. Widgets inside each route vary by
 * the signed-in user's role(s); the shell/nav stays the same for everyone.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid flex-grow-1">
      <div className="row">
        <aside className="col-12 col-md-3 col-lg-2 bg-navy py-4 px-0 min-vh-100">
          <div className="px-3 mb-4">
            <Link href="/" className="fs-5 fw-semibold text-white">
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
    </div>
  );
}
