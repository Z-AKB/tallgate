"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

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

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onResize)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onResize)
    }
  }, [mobileOpen])

  return (
    <AdminContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}
