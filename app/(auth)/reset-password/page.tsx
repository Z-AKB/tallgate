"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getErrorMessage } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { HiOutlineLockClosed, HiOutlineCheckCircle } from "react-icons/hi"

type Phase = "checking" | "ready" | "invalid" | "done"

export default function ResetPasswordPage() {
  const [phase, setPhase] = useState<Phase>("checking")
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const verifyLink = async () => {
      const params = new URLSearchParams(window.location.search)
      const errorCode = params.get("error") || params.get("error_description")
      if (errorCode) {
        setLinkError(errorCode)
        setPhase("invalid")
        return
      }

      const code = params.get("code")
      const tokenHash = params.get("token_hash")
      const type = params.get("type")

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setLinkError(exchangeError.message)
          setPhase("invalid")
          return
        }
        setPhase("ready")
        return
      }

      if (tokenHash && type === "recovery") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        })
        if (otpError) {
          setLinkError(otpError.message)
          setPhase("invalid")
          return
        }
        setPhase("ready")
        return
      }

      setLinkError("This reset link is missing its verification code.")
      setPhase("invalid")
    }

    verifyLink()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password.length > 128) {
      setError("Password must be no more than 128 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        throw new Error(updateError.message)
      }
      setPhase("done")
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update password."))
    } finally {
      setLoading(false)
    }
  }

  if (phase === "checking") {
    return (
      <div className="text-center space-y-2 py-6">
        <p className="text-sm text-slate-500">Verifying your reset link...</p>
      </div>
    )
  }

  if (phase === "invalid") {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center space-y-1">
          <p className="text-sm font-semibold">This reset link is invalid or has expired</p>
          <p className="text-xs">{linkError}</p>
        </div>
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-center space-y-3">
          <HiOutlineCheckCircle className="w-8 h-8 mx-auto text-emerald-500" />
          <p className="text-sm font-medium">Password updated</p>
          <p className="text-xs">You can now sign in with your new password.</p>
        </div>
        <div className="text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover"
          >
            Continue to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Set a New Password
        </h1>
        <p className="text-sm text-slate-500">
          Choose a new password for your TallGate account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            New Password
            <span className="ml-1 font-normal text-slate-500">(required)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HiOutlineLockClosed className="w-5 h-5" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
              placeholder="At least 8 characters"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Confirm New Password
            <span className="ml-1 font-normal text-slate-500">(required)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <HiOutlineLockClosed className="w-5 h-5" />
            </div>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-60"
              placeholder="Repeat the new password"
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
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  )
}
