"use client"

import { useState } from "react"
import { getErrorMessage } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { fetchCurrentRoleNames } from "@/lib/auth/roles"
import { getPostLoginPath } from "@/lib/auth/redirect"
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineInformationCircle } from "react-icons/hi"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      const roles = await fetchCurrentRoleNames(supabase)
      const next = new URLSearchParams(window.location.search).get("next")
      router.push(getPostLoginPath(roles, next))
      router.refresh()
    } catch (err: unknown) {
      console.error("Login error:", err)
      setError(getErrorMessage(err, "Failed to sign in. Please verify credentials."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In to TallGate</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your courses, client projects, or startup roadmap.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-status-danger rounded-lg text-xs flex items-center gap-2">
          <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="form-input text-sm pl-9"
            />
            <HiOutlineMail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="form-label mb-0">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input text-sm pl-9"
            />
            <HiOutlineLockClosed className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center text-sm py-2.5 font-semibold disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In to Portal"}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="font-semibold text-brand-primary hover:underline">
          Create an Account
        </Link>
      </div>
    </div>
  )
}
