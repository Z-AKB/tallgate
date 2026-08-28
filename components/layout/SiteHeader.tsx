import Link from "next/link";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/learn", label: "Learning Hub" },
  { href: "/startups", label: "Startup Hub" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="bg-navy py-3">
      <div className="container d-flex justify-content-between align-items-center">
        <Link href="/" className="fs-4 fw-semibold text-white">
          TallGate
        </Link>

        <nav className="d-none d-lg-flex gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white text-opacity-75"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="d-flex align-items-center gap-3">
          <Link href="/login" className="text-white text-opacity-75 d-none d-sm-inline">
            Sign in
          </Link>
          <Link href="/contact" className="btn btn-primary btn-sm">
            Book a consultation
          </Link>
        </div>
      </div>
    </header>
  );
}
