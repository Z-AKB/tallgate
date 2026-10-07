import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceBySlug, services } from "@/lib/data/services";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  return { title: service?.title ?? "Service" };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <section className="bg-highlight py-5">
        <div className="container py-4">
          <div className="row">
            <div className="col-lg-8">
              <p className="text-uppercase fw-semibold text-primary small mb-2">
                {service.category}
              </p>
              <h1 className="display-6 fw-bold text-navy mb-3">
                {service.title}
              </h1>
              <p className="fs-5 text-muted-tg mb-0">{service.summary}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <p className="fs-6" style={{ lineHeight: 1.8 }}>
                {service.description}
              </p>
            </div>
            <div className="col-lg-4">
              <div className="card border p-4">
                <h2 className="h6 fw-semibold text-navy mb-3">
                  Interested in this service?
                </h2>
                <p className="text-muted-tg small mb-3">
                  Request a consultation and we&apos;ll follow up to scope
                  your project.
                </p>
                <Link href="/contact" className="btn btn-primary w-100">
                  Book a consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
