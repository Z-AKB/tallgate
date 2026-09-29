import React from "react"
import UserDashboardHeader from "@/components/dashboard/UserDashboardHeader"
import Link from "next/link"
import { requireUser } from "@/lib/auth/guards"

export const metadata = {
  title: "User Dashboard | TallGate Student & Client Portal",
  description: "Manage your enrolled courses, view additional services, and explore upcoming programs.",
}

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const displayName = user.profile?.full_name || user.email || "Learner"

  return (
    <div className="min-h-screen flex flex-col bg-brand-canvas text-slate-900 antialiased">
      <UserDashboardHeader
        displayName={displayName}
        email={user.email || user.profile?.email || ""}
        isAdmin={user.roles.includes("admin")}
      />
      <main className="flex-grow py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} TallGate Computing Enterprise. Learner & Client Portal.</p>
          <div className="flex items-center gap-4">
            <Link href="/verify" className="hover:text-brand-primary transition-colors">
              Verify Certificate
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-brand-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
