import CertificateVerification from "@/components/certificates/CertificateVerification"

export const metadata = {
  title: "Verify Certificate | TallGate Dashboard",
  description: "Verify the authenticity and status of a TallGate Academy certificate.",
}

export default function DashboardVerifyPage() {
  return <CertificateVerification variant="dashboard" />
}
