"use client"

import Link from "next/link"
import { HiOutlineAcademicCap, HiOutlineArrowRightOnRectangle, HiOutlineCog6Tooth, HiOutlineUser } from "react-icons/hi2"
import SignOutButton from "@/components/auth/SignOutButton"
import { getPortalPresentation } from "@/lib/auth/roles"

type ProfileMenuProps = {
  displayName: string
  email: string
  roles: string[]
}

export default function ProfileMenu({ displayName, email, roles }: ProfileMenuProps) {
  const { isAdmin } = getPortalPresentation(roles)
  const initials =
    displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TG"

  return (
    <details className="relative">
      <summary
        aria-label="Open profile menu"
        title={displayName}
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full bg-[#202DB8] text-xs font-bold text-white ring-2 ring-[#202DB8]/60 transition-opacity hover:opacity-90 [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        {initials}
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-elevated">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
        </div>
        <div className="p-1.5">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HiOutlineUser className="h-4 w-4 text-slate-400" />
            Profile Settings
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HiOutlineCog6Tooth className="h-4 w-4 text-slate-400" />
            Account Settings
          </Link>
          <Link
            href="/dashboard/verify"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <HiOutlineAcademicCap className="h-4 w-4 text-slate-400" />
            Verify Certificate
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-light"
            >
              <HiOutlineCog6Tooth className="h-4 w-4" />
              Admin Control Center
            </Link>
          ) : null}
          <div className="mt-1 border-t border-slate-100 pt-1.5">
            <SignOutButton className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
              <HiOutlineArrowRightOnRectangle className="h-4 w-4 text-slate-400" />
              Sign Out
            </SignOutButton>
          </div>
        </div>
      </div>
    </details>
  )
}