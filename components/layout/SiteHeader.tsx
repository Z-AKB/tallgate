import Link from "next/link";
import { createClient } from "@/lib/database/server";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/learn", label: "Learning Hub" },
  { href: "/startups", label: "Startup Hub" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    console.error("Unable to determine site-header auth state:", authError);
  }

  let dashboardHref = "/dashboard";
  if (user) {
    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) {
      console.error("Unable to resolve site-header dashboard destination:", roleError);
    } else if (userRole?.role === "admin") {
      dashboardHref = "/admin";
    }
  }

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
          <Link
            href={user ? dashboardHref : "/login"}
            className="text-white text-opacity-75 d-none d-sm-inline"
          >
            {user ? (dashboardHref === "/admin" ? "Admin dashboard" : "Dashboard") : "Sign in"}
          </Link>
          <Link href="/contact" className="btn btn-primary btn-sm">
            Book a consultation
          </Link>
        </div>
      </div>
    </header>
  );
}
