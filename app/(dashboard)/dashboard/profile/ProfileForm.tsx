"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getErrorMessage } from "@/lib/utils"
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineBriefcase } from "react-icons/hi"
import type { Database } from "@/types/supabase"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

type EditableProfileKey =
  | "full_name"
  | "email"
  | "phone"
  | "company_name"
  | "location"
  | "bio"

export type EditableProfile = {
  [K in EditableProfileKey]?: ProfileRow[K] | null
}

export default function ProfileForm({
  initialProfile,
  userId,
}: {
  initialProfile: EditableProfile | null
  userId: string
}) {
  const [formData, setFormData] = useState({
    full_name: initialProfile?.full_name || "",
    phone: initialProfile?.phone || "",
    company_name: initialProfile?.company_name || "",
    location: initialProfile?.location || "",
    bio: initialProfile?.bio || "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          company_name: formData.company_name,
          location: formData.location,
          bio: formData.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      setMessage({ text: "Profile updated successfully.", type: "success" })
    } catch (err: unknown) {
      setMessage({ text: getErrorMessage(err, "Failed to update profile."), type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name
            <span className="ml-1 font-normal text-slate-500">(required)</span>
          </label>
          <div className="relative">
            <HiOutlineUser className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address (Read-only)
          </label>
          <div className="relative">
            <HiOutlineMail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="email"
              disabled
              value={initialProfile?.email || ""}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <HiOutlinePhone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Company Name
          </label>
          <div className="relative">
            <HiOutlineBriefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Location
          </label>
          <div className="relative">
            <HiOutlineLocationMarker className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bio (Optional)
          </label>
          <textarea
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className="w-full p-3 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
            placeholder="Tell us a bit about yourself..."
          />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-2 px-6 text-sm disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
