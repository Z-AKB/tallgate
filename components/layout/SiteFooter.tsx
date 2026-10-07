import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-navy-dark py-5 mt-auto">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-6 col-md-3">
            <h2 className="h6 text-white mb-3">Company</h2>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li>
                <Link href="/about" className="text-white text-opacity-75">
                  About
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-white text-opacity-75">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white text-opacity-75">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-white text-opacity-75">
                  Events
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-6 col-md-3">
            <h2 className="h6 text-white mb-3">Platform</h2>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li>
                <Link href="/services" className="text-white text-opacity-75">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/learn" className="text-white text-opacity-75">
                  Learning Hub
                </Link>
              </li>
              <li>
                <Link href="/startups" className="text-white text-opacity-75">
                  Startup Hub
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-6 col-md-3">
            <h2 className="h6 text-white mb-3">Account</h2>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li>
                <Link href="/login" className="text-white text-opacity-75">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-white text-opacity-75">
                  Register
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-6 col-md-3">
            <h2 className="h6 text-white mb-3">Get in touch</h2>
            <ul className="list-unstyled d-flex flex-column gap-2">
              <li>
                <Link href="/contact" className="text-white text-opacity-75">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <hr className="border-white border-opacity-25" />
        <div className="text-center text-white text-opacity-75 small pt-2">
          © {new Date().getFullYear()} TallGate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
