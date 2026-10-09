"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HiMenu,
  HiX,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineLocationMarker,
} from "react-icons/hi"
import { siteConfig } from "@/lib/config/site"

export interface SiteMobileNavLink {
  href: string
  label: string
}

interface SiteMobileNavProps {
  links: readonly SiteMobileNavLink[]
  dashboardHref: string
  isAuthenticated: boolean
}

export function SiteMobileNav({
  links,
  dashboardHref,
  isAuthenticated,
}: SiteMobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onResize)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onResize)
      trigger?.focus()
    }
  }, [open])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="site-mobile-menu"
      >
        <HiMenu className="h-6 w-6" />
      </button>

      {open && (
        <div
          id="site-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-brand-navy lg:hidden"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-lg font-semibold text-white"
            >
              TallGate
            </Link>
            <button
              type="button"
              ref={closeButtonRef}
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Close menu"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-white/10 font-semibold text-white"
                        : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="shrink-0 space-y-3 border-t border-white/10 px-4 py-4">
            <Link
              href={isAuthenticated ? dashboardHref : "/login"}
              onClick={() => setOpen(false)}
              className="btn-secondary w-full justify-center"
            >
              {isAuthenticated
                ? dashboardHref === "/admin"
                  ? "Admin dashboard"
                  : "Dashboard"
                : "Sign in"}
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="btn-primary w-full justify-center"
            >
              Book a consultation
            </Link>
            <div className="flex flex-col gap-1.5 pt-1 text-sm text-white/70">
              <a
                href={siteConfig.phone.href}
                className="flex items-center gap-2 hover:text-white"
              >
                <HiOutlinePhone className="h-4 w-4 shrink-0 text-indigo-300" />
                {siteConfig.phone.display}
              </a>
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="flex items-center gap-2 break-all hover:text-white"
              >
                <HiOutlineMail className="h-4 w-4 shrink-0 text-indigo-300" />
                {siteConfig.supportEmail}
              </a>
              <span className="flex items-start gap-2">
                <HiOutlineLocationMarker className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
                {siteConfig.address.short}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
