"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type SignOutButtonProps = {
  className?: string
  children: React.ReactNode
}

export default function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={loading} className={className}>
      {loading ? "Signing out..." : children}
    </button>
  )
}
