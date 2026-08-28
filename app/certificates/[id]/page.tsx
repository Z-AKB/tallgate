import { notFound } from "next/navigation";
import { createClient } from "@/lib/database/server";

interface CertificatePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Public, unauthenticated certificate verification (FR-10). Anyone with
 * the link can confirm a certificate is real — this is TallGate's
 * minimum credible signal against AltSchool's accreditation and Utiva's
 * alumni network (Phase 1, Section 4).
 */
export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: certificate } = await supabase
    .from("certificates")
    .select("id, certificate_number, issued_at")
    .eq("id", id)
    .maybeSingle();

  if (!certificate) {
    notFound();
  }

  return (
    <div className="container py-5 my-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card border p-5 text-center">
            <p className="text-uppercase small fw-semibold text-success mb-2">
              Verified certificate
            </p>
            <h1 className="h4 fw-bold text-navy mb-3">
              Certificate #{certificate.certificate_number}
            </h1>
            <p className="text-muted-tg mb-0">
              Issued {new Date(certificate.issued_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
