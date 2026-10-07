"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Logo from "@/components/layout/Logo"
import { siteConfig } from "@/lib/config/site"
import { createClient } from "@/lib/supabase/client"
import { HiMenu, HiX, HiChevronDown, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker } from "react-icons/hi"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [dashboardHref, setDashboardHref] = useState<"/admin" | "/dashboard" | "/login" | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    let receivedAuthEvent = false
    let roleLookupId = 0

    const updateDashboardHref = (userId: string | null) => {
      const lookupId = ++roleLookupId
      if (!userId) {
        setDashboardHref("/login")
        return
      }

      setDashboardHref(null)
      void Promise.resolve().then(async () => {
        const { data, error } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", userId)

        if (!isMounted || lookupId !== roleLookupId) return
        if (error) {
          console.error("Unable to resolve public-site dashboard destination:", error)
          setDashboardHref("/dashboard")
          return
        }

        const isAdmin = (data ?? []).some((assignment) => assignment.roles?.name === "admin")
        setDashboardHref(isAdmin ? "/admin" : "/dashboard")
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true
      if (!isMounted) return
      setIsAuthenticated(Boolean(session?.user))
      updateDashboardHref(session?.user.id ?? null)
    })

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted || receivedAuthEvent) return
        if (error && error.name !== "AuthSessionMissingError") {
          console.error("Unable to determine public-site auth state:", error)
        }
        const user = error ? null : data.user
        setIsAuthenticated(Boolean(user))
        updateDashboardHref(user?.id ?? null)
      })
      .catch((error: unknown) => {
        if (!isMounted || receivedAuthEvent) return
        console.error("Unable to determine public-site auth state:", error)
        setIsAuthenticated(false)
        updateDashboardHref(null)
      })

    return () => {
      isMounted = false
      roleLookupId += 1
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onResize)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onResize)
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { name: "Services", href: "/services" },
    { name: "Learning Hub", href: "/learning-hub" },
    { name: "Startup Hub", href: "/startup-hub" },
    { name: "Case Studies", href: "/portfolio" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.09] bg-[#061A4F]/85 backdrop-blur-xl">
      {/* Top Contact Ribbon */}
      <div className="hidden lg:block bg-white/[0.025] text-slate-400 text-xs py-2 px-6 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <HiOutlineLocationMarker className="w-3.5 h-3.5 text-indigo-300" />
              <span>{siteConfig.address.line1}, {siteConfig.address.line2}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <HiOutlinePhone className="w-3.5 h-3.5 text-indigo-300" />
              <a href={siteConfig.phone.href} className="hover:text-white transition-colors">{siteConfig.phone.display}</a>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <HiOutlineMail className="w-3.5 h-3.5 text-indigo-300" />
              <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-white transition-colors">{siteConfig.supportEmail}</a>
            </span>
            <span className="text-slate-700">|</span>
            <Link href="/verify" prefetch={true} className="hover:text-white transition-colors">
              Verify Certificate
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Logo variant="light" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`border-b-2 px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                  isActive(link.href)
                    ? "border-blue-500 text-white font-semibold"
                    : "border-transparent text-slate-300 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {dashboardHref === null ? (
              <span className="w-16" aria-hidden="true" />
            ) : (
              <Link
                href={dashboardHref}
                prefetch={true}
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
              >
                {isAuthenticated ? "Dashboard" : "Sign In"}
              </Link>
            )}
            <Link
              href="/consultation"
              prefetch={true}
              className="btn-primary text-xs active:scale-95"
            >
              Book Consultation
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/consultation"
              prefetch={true}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Consult
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
            >
              {mobileMenuOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="landing-mobile-menu"
            role="dialog"
            aria-modal="true"
            className="md:hidden border-t border-white/10 bg-[#061A4F] px-4 pt-2 pb-6 space-y-2 shadow-dropdown"
          >
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-white bg-white/10 font-semibold"
                    : "text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            <Link
              href="/consultation"
              prefetch={true}
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full justify-center"
            >
              Book Business Consultation
            </Link>
            {isAuthenticated !== null && dashboardHref !== null && (
              <Link
                href={dashboardHref}
                prefetch={true}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-secondary w-full justify-center"
              >
                {isAuthenticated ? "Open Dashboard" : "Portal Sign In"}
              </Link>
            )}
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>📍 {siteConfig.address.short}</p>
              <p>📞 {siteConfig.phone.display}</p>
            </div>
          </div>
          </div>
        </>
      )}
    </header>
  )
}
