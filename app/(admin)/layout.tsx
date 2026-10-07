import React from "react"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminHeader from "@/components/admin/AdminHeader"
import { AdminProvider } from "@/components/admin/AdminContext"
import { requireAdmin } from "@/lib/auth/guards"

export const metadata = {
  title: "Admin Control Center | TallGate Operations",
  description: "Executive control panel, admissions triage, startup evaluation, and credentials registry.",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()

  return (
    <AdminProvider>
      <div className="admin-shell min-h-screen flex overflow-x-hidden text-slate-100 antialiased">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
          <AdminHeader
            initialName={user.profile?.full_name || "Admin"}
            initialEmail={user.email || user.profile?.email || ""}
            initialPhone={user.profile?.phone || ""}
          />
          <main className="flex-1 min-w-0 overflow-x-hidden p-5 sm:p-8 lg:p-10 max-w-[1440px] w-full mx-auto space-y-8">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  )
}
