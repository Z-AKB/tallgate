import Link from "next/link";

const COLUMNS: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/blog", label: "Blog" },
      { href: "/events", label: "Events" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { href: "/services", label: "Services" },
      { href: "/learn", label: "Learning Hub" },
      { href: "/startups", label: "Startup Hub" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Register" },
    ],
  },
  {
    heading: "Get in touch",
    links: [{ href: "/contact", label: "Contact" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-brand-navy py-10 mt-auto">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="text-sm font-semibold text-white mb-3">{column.heading}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <hr className="border-white/20" />
        <div className="text-center text-white/75 text-xs pt-4">
          © {new Date().getFullYear()} TallGate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
