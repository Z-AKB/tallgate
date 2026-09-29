import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow={`About ${siteConfig.companyName}`}
        title="About Us"
        description={siteConfig.tagline}
      />

      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-10">
              <h2 className="h4 fw-bold text-navy mb-3">About Us</h2>
              <p className="text-muted-tg">
                TALLGATE LIMITED is a forward-thinking hybrid technology and
                service company dedicated to helping small and medium-sized
                businesses establish, strengthen, and scale their digital
                presence. We provide affordable, practical, and results-driven
                digital solutions that enable businesses to compete effectively
                in an increasingly digital economy.
              </p>
              <p className="text-muted-tg">
                Founded on the belief that every business deserves access to
                modern digital tools, TALLGATE bridges the gap between
                traditional business operations and digital transformation.
                Through a combination of technology, strategic support, and
                skilled talent, we help businesses improve visibility, attract
                customers, increase sales, and achieve sustainable growth.
              </p>
              <p className="text-muted-tg mb-0">
                In addition to supporting businesses, TALLGATE is committed to
                empowering the next generation of professionals by creating
                opportunities for university students and young graduates to
                develop valuable digital skills, gain practical experience, and
                participate in meaningful employment opportunities.
              </p>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-lg-6">
              <div className="card h-100 border p-4">
                <h2 className="h5 fw-semibold text-navy mb-2">Our Vision</h2>
                <p className="text-muted-tg mb-0">
                  To become Africa&apos;s leading digital enablement company,
                  empowering businesses and individuals through technology,
                  innovation, and opportunity.
                </p>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 border p-4">
                <h2 className="h5 fw-semibold text-navy mb-2">Our Mission</h2>
                <p className="text-muted-tg mb-0">
                  To simplify digital transformation for small businesses by
                  providing accessible, affordable, and innovative solutions
                  that drive growth, efficiency, and long-term success.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <h2 className="h4 fw-bold text-navy mb-4">Our Core Values</h2>
            <div className="row g-4">
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border p-4">
                  <h3 className="h6 fw-semibold text-navy mb-2">Innovation</h3>
                  <p className="text-muted-tg small mb-0">
                    We continuously explore new technologies and creative
                    approaches to solve business challenges.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border p-4">
                  <h3 className="h6 fw-semibold text-navy mb-2">Excellence</h3>
                  <p className="text-muted-tg small mb-0">
                    We are committed to delivering high-quality services and
                    measurable results.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border p-4">
                  <h3 className="h6 fw-semibold text-navy mb-2">Integrity</h3>
                  <p className="text-muted-tg small mb-0">
                    We build trust through transparency, professionalism, and
                    ethical business practices.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border p-4">
                  <h3 className="h6 fw-semibold text-navy mb-2">Empowerment</h3>
                  <p className="text-muted-tg small mb-0">
                    We create opportunities for businesses, students, and
                    communities to grow and thrive.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border p-4">
                  <h3 className="h6 fw-semibold text-navy mb-2">
                    Customer Success
                  </h3>
                  <p className="text-muted-tg small mb-0">
                    Our clients&apos; success is the foundation of our success.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border p-4">
                  <h3 className="h6 fw-semibold text-navy mb-2">
                    Collaboration
                  </h3>
                  <p className="text-muted-tg small mb-0">
                    We believe that strong partnerships drive sustainable
                    growth and innovation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
