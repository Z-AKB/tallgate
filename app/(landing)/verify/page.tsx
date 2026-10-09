import CertificateVerification from "@/components/certificates/CertificateVerification"

export const metadata = {
  title: "Verify a Certificate | TallGate",
  description:
    "Verify the authenticity of a TallGate certificate using its verification code or QR link.",
  robots: { index: false, follow: false },
}

export default function VerifyPage() {
  return <CertificateVerification />
}
