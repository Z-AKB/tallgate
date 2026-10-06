import CertificateVerification from "@/components/certificates/CertificateVerification"

export const metadata = {
  title: "Certificate Verification | TallGate Admin",
  description: "Verify a TallGate certificate from the admin dashboard.",
}

export default function AdminCertificateVerificationPage() {
  return <CertificateVerification variant="admin" />
}
