"use client"

import { useState } from "react"
import { getErrorMessage } from "@/lib/utils"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { HiOutlineMail, HiOutlineCheckCircle } from "react-icons/hi"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (resetError) {
        throw new Error(resetError.message)
      }

      setSuccess(true)
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reset link."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-slate-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-center space-y-3">
          <HiOutlineCheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
          <p className="text-sm font-medium">Reset link sent to {email}</p>
          <p className="text-xs">
            Check your inbox (and spam folder) for the password reset link.
          </p>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Email Address
              <span className="ml-1 font-normal text-slate-500">(required)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <HiOutlineMail className="w-5 h-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center text-sm py-2.5 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <div className="text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover"
        >
          Return to login
        </Link>
      </div>
    </div>
  )
}
