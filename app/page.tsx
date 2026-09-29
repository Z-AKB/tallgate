export default function HomePage() {
  return (
    <>
      <header className="bg-navy py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <span className="fs-4 fw-semibold">TallGate</span>
          <nav className="d-none d-md-flex gap-4">
            <a href="/services" className="text-white text-opacity-75">
              Services
            </a>
            <a href="/portfolio" className="text-white text-opacity-75">
              Portfolio
            </a>
            <a href="/learning" className="text-white text-opacity-75">
              Learning Hub
            </a>
            <a href="/startups" className="text-white text-opacity-75">
              Startup Hub
            </a>
            <a href="/contact" className="text-white text-opacity-75">
              Contact
            </a>
          </nav>
          <a href="/contact" className="btn btn-primary btn-sm">
            Book a consultation
          </a>
        </div>
      </header>

      <main className="flex-grow-1">
        {/* Primary hero — leads with TallGate as a tech business (services),
            not just an education platform. Learning Hub and Startup Hub are
            supporting pillars, surfaced below. */}
        <section className="bg-highlight py-5">
          <div className="container py-5">
            <div className="row">
              <div className="col-lg-8">
                <p className="text-uppercase fw-semibold text-primary small mb-2">
                  Software &amp; Technology Services
                </p>
                <h1 className="display-5 fw-bold text-navy mb-3">
                  The technology partner behind Nigerian and West African
                  businesses.
                </h1>
                <p className="fs-5 text-muted-tg mb-4">
                  Software development, web and mobile builds, cloud,
                  cybersecurity, and technical consulting — delivered by a
                  team that also trains the region&apos;s next developers and
                  backs its next startups.
                </p>
                <div className="d-flex gap-3">
                  <a href="/services" className="btn btn-primary btn-lg">
                    Explore services
                  </a>
                  <a
                    href="/contact"
                    className="btn btn-outline-primary btn-lg"
                  >
                    Book a consultation
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secondary pillars: Learning Hub + Startup Hub, positioned as part
            of the same ecosystem rather than the platform's main identity. */}
        <section className="py-5">
          <div className="container">
            <div className="row g-4">
              <div className="col-md-4">
                <div className="card h-100 border p-4">
                  <h2 className="h5 fw-semibold text-navy mb-2">
                    Services
                  </h2>
                  <p className="text-muted-tg mb-3">
                    Software, web, mobile, cloud, cybersecurity, and
                    consulting for businesses that need real technical work
                    done.
                  </p>
                  <a href="/services" className="fw-semibold">
                    View services &rarr;
                  </a>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border p-4">
                  <h2 className="h5 fw-semibold text-navy mb-2">
                    Learning Hub
                  </h2>
                  <p className="text-muted-tg mb-3">
                    Courses, tutorials, and structured paths for developers
                    building real, verifiable skills.
                  </p>
                  <a href="/learning" className="fw-semibold">
                    Start learning &rarr;
                  </a>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card h-100 border p-4">
                  <h2 className="h5 fw-semibold text-navy mb-2">
                    Startup Hub
                  </h2>
                  <p className="text-muted-tg mb-3">
                    Application review, startup profiles, and mentorship
                    support for early-stage founders.
                  </p>
                  <a href="/startups" className="fw-semibold">
                    Explore Startup Hub &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-navy-dark py-4 mt-auto">
        <div className="container text-center text-white text-opacity-75 small">
          © {new Date().getFullYear()} TallGate. All rights reserved.
        </div>
      </footer>
    </>
  );
}
