"use client"

import React, { createContext, useContext, useState } from "react"

interface AdminContextType {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggleMobile: () => void
}

const AdminContext = createContext<AdminContextType>({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
})

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = () => setMobileOpen((prev) => !prev)

  return (
    <AdminContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
