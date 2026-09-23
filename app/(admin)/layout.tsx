import React from "react"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminHeader from "@/components/admin/AdminHeader"

export const metadata = {
  title: "Admin Control Center | TallGate Operations",
  description: "Executive control panel, admissions triage, startup evaluation, and credentials registry.",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-shell min-h-screen flex overflow-x-hidden text-slate-100 antialiased">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
        <AdminHeader />
        <main className="flex-1 min-w-0 overflow-x-hidden p-5 sm:p-8 lg:p-10 max-w-[1440px] w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  )
}
