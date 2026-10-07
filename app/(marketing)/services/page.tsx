import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { services } from "@/lib/data/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Software development, design, infrastructure, and consulting services for businesses across Nigeria and West Africa.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Technical work, delivered by people who also teach it."
        description="From a single consultation to a full build, our services are scoped around your business, not sold as a fixed package."
      />

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {services.map((service) => (
              <div key={service.slug} className="col-md-6 col-lg-4">
                <Link
                  href={`/services/${service.slug}`}
                  className="card h-100 border p-4 text-decoration-none"
                >
                  <p className="text-uppercase small fw-semibold text-primary mb-2">
                    {service.category}
                  </p>
                  <h2 className="h5 fw-semibold text-navy mb-2">
                    {service.title}
                  </h2>
                  <p className="text-muted-tg mb-0">{service.summary}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-highlight py-5">
        <div className="container text-center py-3">
          <h2 className="h3 fw-bold text-navy mb-3">
            Not sure which service fits?
          </h2>
          <p className="text-muted-tg mb-4">
            Tell us what you&apos;re trying to solve and we&apos;ll scope it
            with you.
          </p>
          <Link href="/contact" className="btn btn-primary btn-lg">
            Book a consultation
          </Link>
        </div>
      </section>
    </>
  );
}
