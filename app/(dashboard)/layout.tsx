import React from "react"
import UserDashboardHeader from "@/components/dashboard/UserDashboardHeader"
import Link from "next/link"
import { requireUser } from "@/lib/auth/guards"
import { redirect } from "next/navigation"
import { siteConfig } from "@/lib/config/site"
import { getPortalPresentation } from "@/lib/auth/roles"

export const metadata = {
  title: "Account Dashboard | TallGate",
  description: "Manage your TallGate account, view services, and explore available programs.",
}

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const displayName = user.profile?.full_name || user.email || "Account"
  const portal = getPortalPresentation(user.roles)
  if (portal.isAdmin) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-canvas text-slate-900 antialiased">
      <UserDashboardHeader
        displayName={displayName}
        email={user.email || user.profile?.email || ""}
        roles={user.roles}
      />
      <main className="flex-grow py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} {siteConfig.companyName}.{" "}
            {portal.isAdmin
              ? "Admin & Client Portal."
              : portal.isLearner
                ? "Learner & Client Portal."
                : "Account Portal."}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/verify" className="hover:text-brand-primary transition-colors">
              Verify Certificate
            </Link>
            <span>•</span>
            <Link href="/dashboard/support" className="hover:text-brand-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
