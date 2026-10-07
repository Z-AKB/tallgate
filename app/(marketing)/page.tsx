import Link from "next/link";

export default function HomePage() {
  return (
    <>
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
                <Link href="/services" className="btn btn-primary btn-lg">
                  Explore services
                </Link>
                <Link href="/contact" className="btn btn-outline-primary btn-lg">
                  Book a consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border p-4">
                <h2 className="h5 fw-semibold text-navy mb-2">Services</h2>
                <p className="text-muted-tg mb-3">
                  Software, web, mobile, cloud, cybersecurity, and
                  consulting for businesses that need real technical work
                  done.
                </p>
                <Link href="/services" className="fw-semibold">
                  View services &rarr;
                </Link>
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
                <Link href="/learn" className="fw-semibold">
                  Start learning &rarr;
                </Link>
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
                <Link href="/startups" className="fw-semibold">
                  Explore Startup Hub &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
