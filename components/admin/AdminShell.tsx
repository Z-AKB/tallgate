import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/startups", label: "Startups" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/certificates", label: "Certificates" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid flex-grow-1">
      <div className="row">
        <aside className="col-12 col-md-3 col-lg-2 bg-navy-dark py-4 px-0 min-vh-100">
          <div className="px-3 mb-4">
            <Link href="/" className="fs-5 fw-semibold text-white">
              TallGate <span className="text-opacity-75">Admin</span>
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
