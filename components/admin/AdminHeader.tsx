"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Logo from "@/components/layout/Logo"
import { useAdmin } from "@/components/admin/AdminContext"
import SignOutButton from "@/components/auth/SignOutButton"
import { createClient } from "@/lib/supabase/client"
import { siteConfig } from "@/lib/config/site"
import { getErrorMessage } from "@/lib/utils"
import {
  HiOutlineBell,
  HiChevronDown,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineUser,
  HiOutlineCheck,
  HiOutlineEnvelope,
  HiOutlineBriefcase,
  HiOutlinePhone,
  HiOutlineLockClosed,
} from "react-icons/hi2"

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  initialName?: string
  initialEmail?: string
}

const getBreadcrumbTitle = (pathname: string) => {
  if (pathname === "/admin") return "Overview & Metrics"
  if (pathname.startsWith("/admin/inquiries")) return "Consultation Queue"
  if (pathname.startsWith("/admin/startups")) return "Startup Applications"
  if (pathname.startsWith("/admin/courses")) return "Course Curriculum"
  if (pathname.startsWith("/admin/enrollments")) return "Student Enrollments"
  if (pathname.startsWith("/admin/certificates")) return "Certificate Registry"
  if (pathname.startsWith("/admin/messages")) return "General Inquiries"
  return "Admin Panel"
}

export default function AdminHeader({ title, subtitle, initialName, initialEmail }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const pageTitle = title || getBreadcrumbTitle(pathname)
  const { mobileOpen, toggleMobile } = useAdmin()

  // Admin Profile Settings State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: initialName || "Admin Lead",
    email: initialEmail || siteConfig.supportEmail,
    role: "Operations & Systems Lead",
    phone: "",
  })

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      name: initialName || prev.name,
      email: initialEmail || prev.email,
    }))
  }, [initialName, initialEmail])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) {
        throw new Error("Your session has expired. Please sign in again.")
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.name,
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)

      if (error) throw error

      setSavedSuccess(true)
      router.refresh()
      setTimeout(() => {
        setSavedSuccess(false)
        setSettingsOpen(false)
      }, 1200)
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, "Failed to save profile."))
    } finally {
      setSaving(false)
    }
  }

  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD"

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#061A4F]/90 backdrop-blur-xl border-b border-[#245CDB]/60 px-4 sm:px-8 py-4 transition-all">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Mobile Menu Button & Brand / Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Anchored Mobile Toggle inside header */}
            <button
              onClick={toggleMobile}
              className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/10 focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileOpen}
              aria-controls="admin-sidebar"
            >
              {mobileOpen ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3 className="w-5 h-5" />}
            </button>

            {/* Mobile Logo linking to /admin */}
            <div className="block lg:hidden shrink-0">
              <Logo variant="light" href="/admin" width={135} height={34} showWordmark={true} />
            </div>

            {/* Compact Page Title for tablet widths */}
            <div className="hidden sm:block lg:hidden min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">
                {pageTitle}
              </h2>
            </div>

            {/* Desktop Breadcrumb & Title */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin
                </Link>
                <span>/</span>
                <span className="text-slate-200 font-semibold">{pageTitle}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                <span>{pageTitle}</span>
                {subtitle && <span className="text-xs font-normal text-slate-400">({subtitle})</span>}
              </h2>
            </div>
          </div>

          {/* Right Actions & Admin Identity */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0">
            <button
              aria-label="Admin Alerts"
              className="hidden sm:block p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 relative transition-colors"
            >
              <HiOutlineBell className="w-5 h-5" />
            </button>

            <SignOutButton className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10">
              Sign out
            </SignOutButton>

            <div className="hidden sm:block h-8 w-px bg-[#245CDB]/70" />

            {/* Clickable Profile Avatar Button opening Account Settings */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Open Account Settings"
              title="Click to open Account Settings"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-navy text-white font-bold text-xs sm:text-sm flex items-center justify-center ring-2 ring-brand-primary">
                {initials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">{profile.name}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{profile.role}</span>
              </div>
              <HiChevronDown className="hidden md:block w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin Account Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-bold text-base flex items-center justify-center ring-2 ring-white/20">
                  {initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Admin Account Settings</h3>
                  <p className="text-xs text-slate-400">Manage your administrative profile and security</p>
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {savedSuccess ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center space-y-2">
                <HiOutlineCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-emerald-300">Profile Updated Successfully</p>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <HiOutlineUser className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <HiOutlineEnvelope className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      readOnly
                      disabled
                      value={profile.email}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Sign-in email is managed by your authentication account and cannot be edited here.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Role / Position
                    </label>
                    <div className="relative">
                      <HiOutlineBriefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Direct Telephone
                    </label>
                    <div className="relative">
                      <HiOutlinePhone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-400">
                  <HiOutlineLockClosed className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    To rotate executive access keys or modify Supabase service credentials, contact senior infrastructure engineering.
                  </span>
                </div>

                {saveError && (
                  <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                    {saveError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary text-xs px-5 py-2.5 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
