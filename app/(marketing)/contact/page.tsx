import type { Metadata } from "next";
import { PageHeader } from "@/components/marketing/PageHeader";
import { InquiryForm } from "@/features/inquiries/components/InquiryForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us what you need"
        description="Whether it's a consultation request, a business inquiry, or a support question, this goes straight to our team."
      />

      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-7">
              <div className="card border p-4 p-md-5">
                <InquiryForm />
              </div>
            </div>
            <div className="col-lg-5">
              <h2 className="h5 fw-semibold text-navy mb-3">
                What happens next
              </h2>
              <p className="text-muted-tg">
                Your request goes into our team&apos;s inquiry queue. We
                review and follow up directly by email or phone — there&apos;s
                no automated booking yet, so expect a real reply from a
                person, not an instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
