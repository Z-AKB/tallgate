"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/layout/Logo"
import SignOutButton from "@/components/auth/SignOutButton"
import { getPortalPresentation } from "@/lib/auth/roles"
import {
  HiOutlineSquares2X2,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
  HiBars3,
  HiXMark,
} from "react-icons/hi2"

type UserDashboardHeaderProps = {
  displayName: string
  email: string
  roles: string[]
}

export default function UserDashboardHeader({
  displayName,
  email,
  roles,
}: UserDashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAdmin, isLearner, portalLabel } = getPortalPresentation(roles)
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TG"

  const dashboardNavLinks = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: HiOutlineSquares2X2,
    },
    ...(isLearner
      ? [
          {
            name: "More Courses",
            href: "/dashboard/courses",
            icon: HiOutlineAcademicCap,
          },
        ]
      : []),
    {
      name: "Our Other Services",
      href: "/dashboard/services",
      icon: HiOutlineBriefcase,
    },
    {
      name: "Profile Settings",
      href: "/dashboard/profile",
      icon: HiOutlineUser,
    },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#031544] border-b border-[#202DB8]/40 shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          <div className="flex items-center gap-3 sm:gap-4">
            <Logo variant="light" href="/dashboard" />
            <div className="h-6 w-px bg-white/15 hidden sm:block" />
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#202DB8]/30 text-indigo-100 border border-[#202DB8]/50 tracking-wide uppercase">
              {portalLabel}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            {dashboardNavLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#202DB8] text-white shadow-sm shadow-[#202DB8]/30"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAdmin ? (
              <Link href="/admin" className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
                Admin
              </Link>
            ) : null}
            <Link
              href="/dashboard/verify"
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Verify Certificate
            </Link>
            <div className="h-5 w-px bg-white/15" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#202DB8] text-white font-bold text-xs flex items-center justify-center ring-2 ring-[#202DB8]/60">
                {initials}
              </div>
              <div className="text-left">
                <span className="block text-xs font-semibold text-white leading-tight">{displayName}</span>
                <span className="block text-[10px] text-slate-400">{email}</span>
              </div>
            </div>
            <SignOutButton
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
            </SignOutButton>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <span className="text-[10px] font-semibold bg-[#202DB8]/30 text-indigo-100 border border-[#202DB8]/50 px-2 py-0.5 rounded">
              {portalLabel.replace(" Portal", "")}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#202DB8]/40 bg-[#031544] px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {dashboardNavLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#202DB8] text-white font-semibold"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 text-indigo-300" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 text-xs text-slate-300">
              <span>{displayName}</span>
              <span className="font-semibold text-emerald-400">Signed in</span>
            </div>
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg"
              >
                Admin Control Center
              </Link>
            ) : null}
            <Link
              href="/dashboard/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg"
            >
              Verify Certificate
            </Link>
            <SignOutButton className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/40">
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
              <span>Sign Out</span>
            </SignOutButton>
          </div>
        </div>
      )}
    </header>
  )
}
