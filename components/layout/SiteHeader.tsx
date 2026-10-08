import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/learn", label: "Learning Hub" },
  { href: "/startups", label: "Startup Hub" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export async function SiteHeader() {
  const currentUser = await getCurrentUser();

  const dashboardHref = currentUser?.roles.includes("admin") ? "/admin" : "/dashboard";
  const user = currentUser;

  return (
    <header className="bg-brand-navy py-3">
      <div className="mx-auto max-w-7xl px-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold text-white shrink-0">
          TallGate
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/75 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={user ? dashboardHref : "/login"}
            className="hidden sm:inline text-sm text-white/75 hover:text-white transition-colors"
          >
            {user ? (dashboardHref === "/admin" ? "Admin dashboard" : "Dashboard") : "Sign in"}
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all"
          >
            Book a consultation
          </Link>
        </div>
      </div>
    </header>
  );
}
