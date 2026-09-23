"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/layout/Logo"
import {
  HiOutlineSquares2X2,
  HiOutlineInboxStack,
  HiOutlineRocketLaunch,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineIdentification,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineBars3,
  HiOutlineXMark,
} from "react-icons/hi2"

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin", icon: HiOutlineSquares2X2 },
  { name: "Consultation Queue", href: "/admin/inquiries", icon: HiOutlineInboxStack, badge: "Leads" },
  { name: "Startup Applications", href: "/admin/startups", icon: HiOutlineRocketLaunch, badge: "Hub" },
  { name: "Course Catalog", href: "/admin/courses", icon: HiOutlineAcademicCap },
  { name: "Student Enrollments", href: "/admin/enrollments", icon: HiOutlineUserGroup },
  { name: "Certificate Registry", href: "/admin/certificates", icon: HiOutlineIdentification },
  { name: "General Inquiries", href: "/admin/messages", icon: HiOutlineChatBubbleLeftRight },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-xl bg-slate-900 text-white shadow-lg border border-slate-700 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <HiOutlineXMark className="w-5 h-5" /> : <HiOutlineBars3 className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#061A4F] text-slate-300 border-r border-white/[0.10] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 pl-20 pr-6 lg:px-6 flex items-center justify-between border-b border-slate-800/60">
          <Logo variant="light" width={180} height={48} className="h-auto" />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Operations & Intake
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.slice(0, 3).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-800 text-slate-300 border border-slate-700/50"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Academy & Credentials
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.slice(3, 6).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Communication
            </span>
            <nav className="mt-2 space-y-1">
              {navItems.slice(6).map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                        : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer Shortcut to Live App */}
        <div className="p-4 border-t border-white/[0.10] bg-[#040F35]/60 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <span>View Live Site</span>
            <HiOutlineArrowTopRightOnSquare className="w-4 h-4 text-slate-400" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <span>Student Dashboard</span>
            <HiOutlineArrowTopRightOnSquare className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </aside>
    </>
  )
}
