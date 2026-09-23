"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HiOutlineBell,
  HiChevronDown,
} from "react-icons/hi2"

interface AdminHeaderProps {
  title?: string
  subtitle?: string
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

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const pathname = usePathname()
  const pageTitle = title || getBreadcrumbTitle(pathname)

  return (
    <header className="sticky top-0 z-30 bg-[#061A4F]/80 backdrop-blur-xl border-b border-[#245CDB]/60 px-6 sm:px-9 py-5 transition-all">
        <div className="flex items-center justify-between gap-4">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-3 pl-12 lg:pl-0">
          <div>
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
        <div className="flex items-center gap-3 sm:gap-5">
          <button
            aria-label="Admin Alerts"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 relative transition-colors"
          >
            <HiOutlineBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-primary rounded-full ring-2 ring-[#061A4F]"></span>
          </button>

          <div className="hidden sm:block h-9 w-px bg-[#245CDB]/70" />
          <div className="flex items-center gap-2.5 sm:pl-0">
            <div className="w-10 h-10 rounded-full bg-brand-navy text-white font-bold text-sm flex items-center justify-center ring-2 ring-brand-primary">
              AD
            </div>
            <span className="hidden md:block text-sm font-semibold text-white">Admin</span>
            <HiChevronDown className="hidden md:block w-5 h-5 text-slate-300" />
          </div>
        </div>
      </div>
    </header>
  )
}
