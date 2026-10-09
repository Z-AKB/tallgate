import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Verify your email" }

export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Check your email
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          We&apos;ve sent a verification link to the email address you signed up
          with. Click it to activate your account, then sign in.
        </p>
      </div>
      <Link
        href="/login"
        className="btn-primary w-full justify-center text-sm py-2.5 font-semibold"
      >
        Back to sign in
      </Link>
    </div>
  )
}
