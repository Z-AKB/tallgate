import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
  return (
    <div className="card border p-4 p-md-5 text-center" style={{ maxWidth: 420 }}>
      <h1 className="h3 fw-bold text-navy mb-3">Check your email</h1>
      <p className="text-muted-tg mb-4">
        We&apos;ve sent a verification link to the email address you signed
        up with. Click it to activate your account, then sign in.
      </p>
      <Link href="/login" className="btn btn-primary">
        Back to sign in
      </Link>
    </div>
  );
}
