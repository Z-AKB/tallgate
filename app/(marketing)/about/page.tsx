import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About TallGate"
        title="One platform for the full journey — learn, build, get help, grow."
      />

      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-6">
              <h2 className="h4 fw-bold text-navy mb-3">Our mission</h2>
              <p className="text-muted-tg">
                TallGate exists so a person in Nigeria or West Africa doesn&apos;t
                need five disconnected relationships to learn a technical
                skill, launch a startup, and get real technical work done.
                We build the software and provide the services directly —
                the learning and startup support exist to serve that same
                trust relationship, not as a separate product.
              </p>
            </div>
            <div className="col-lg-6">
              <h2 className="h4 fw-bold text-navy mb-3">Our approach</h2>
              <p className="text-muted-tg">
                We&apos;d rather be excellent at one thing before growing the
                surface area. That&apos;s why services and consulting come
                first, with Learning Hub and Startup Hub built out
                deliberately rather than all at once.
              </p>
            </div>
          </div>

          <div className="row g-4 mt-4">
            <div className="col-md-4">
              <div className="card h-100 border p-4">
                <h3 className="h6 fw-semibold text-navy mb-2">Trust</h3>
                <p className="text-muted-tg small mb-0">
                  Clear scope, real follow-through, no applications that
                  disappear into a black hole.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border p-4">
                <h3 className="h6 fw-semibold text-navy mb-2">Depth over breadth</h3>
                <p className="text-muted-tg small mb-0">
                  We ship one pillar well before expanding to the next.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border p-4">
                <h3 className="h6 fw-semibold text-navy mb-2">Regional focus</h3>
                <p className="text-muted-tg small mb-0">
                  Built for Nigeria and West Africa specifically, not a
                  generic global product.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
