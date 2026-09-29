"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { fetchCurrentRoleNames } from "@/lib/auth/roles"
import { getPostLoginPath } from "@/lib/auth/redirect"
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineInformationCircle } from "react-icons/hi"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    accountType: "learner",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            account_type: formData.accountType,
          },
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      const roles = await fetchCurrentRoleNames(supabase)
      router.push(getPostLoginPath(roles))
      router.refresh()
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Failed to create account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create a TallGate Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Join Nigeria&apos;s leading technology ecosystem.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-status-danger rounded-lg text-xs flex items-center gap-2">
          <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="form-label">
            Full Name
          </label>
          <div className="relative">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. Musa Abdullahi"
              className="form-input text-sm pl-9"
            />
            <HiOutlineUser className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              className="form-input text-sm pl-9"
            />
            <HiOutlineMail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label htmlFor="accountType" className="form-label">
            I am joining as a
          </label>
          <select
            id="accountType"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            className="form-select text-xs"
          >
            <option value="learner">Student / Academy Learner</option>
            <option value="startup_founder">Startup Founder / Entrepreneur</option>
            <option value="business_owner">Business Owner / Enterprise Client</option>
          </select>
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Create Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
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
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  )
}
