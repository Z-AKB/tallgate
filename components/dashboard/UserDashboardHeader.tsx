"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/layout/Logo"
import SignOutButton from "@/components/auth/SignOutButton"
import ProfileMenu from "@/components/dashboard/ProfileMenu"
import CourseSearch, { type EnrolledCourse } from "@/components/dashboard/CourseSearch"
import { getPortalPresentation } from "@/lib/auth/roles"
import {
  HiOutlineSquares2X2,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineArrowRightOnRectangle,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiBars3,
  HiXMark,
} from "react-icons/hi2"

export type { EnrolledCourse }

type UserDashboardHeaderProps = {
  displayName: string
  email: string
  roles: string[]
  courses: EnrolledCourse[]
}

export default function UserDashboardHeader({
  displayName,
  email,
  roles,
  courses,
}: UserDashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAdmin, isLearner, portalLabel } = getPortalPresentation(roles)

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
    <header className="sticky top-0 z-40 w-full border-b border-[#202DB8]/40 bg-[#031544] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Logo variant="light" href="/dashboard" className="shrink-0" />
            <div className="hidden h-6 w-px bg-white/15 sm:block" />
            <span className="hidden shrink-0 rounded-md border border-[#202DB8]/50 bg-[#202DB8]/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-100 sm:inline-flex">
              {portalLabel}
            </span>
          </div>

          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Dashboard navigation">
            {dashboardNavLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-[#202DB8] text-white shadow-sm shadow-[#202DB8]/30"
                      : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <CourseSearch courses={courses} className="hidden w-44 md:block xl:w-64" />
            <ProfileMenu displayName={displayName} email={email} roles={roles} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <HiXMark className="h-6 w-6" /> : <HiBars3 className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#202DB8]/40 bg-[#031544] px-4 pb-6 pt-3 space-y-4 lg:hidden">
          <CourseSearch
            courses={courses}
            onNavigate={() => setMobileMenuOpen(false)}
            className="block"
          />

          <div className="space-y-1">
            {dashboardNavLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#202DB8] text-white font-semibold"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 text-indigo-300" />
                  <span>{link.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <p className="px-2 text-sm font-semibold text-white">{displayName}</p>
            <Link
              href="/dashboard/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              <HiOutlineUser className="h-4 w-4 text-slate-400" />
              Profile Settings
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              <HiOutlineCog6Tooth className="h-4 w-4 text-slate-400" />
              Account Settings
            </Link>
            <Link
              href="/dashboard/verify"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
            >
              <HiOutlineAcademicCap className="h-4 w-4 text-slate-400" />
              Verify Certificate
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-300 hover:bg-white/[0.06] hover:text-white"
              >
                <HiOutlineCog6Tooth className="h-4 w-4" />
                Admin Control Center
              </Link>
            ) : null}
            <SignOutButton className="flex items-center justify-center gap-2 rounded-lg border border-rose-800/40 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300">
              <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              <span>Sign Out</span>
            </SignOutButton>
          </div>
        </div>
      )}
    </header>
  )
}