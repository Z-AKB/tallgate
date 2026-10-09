"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the digest server-side correlation while keeping the UI generic.
    console.error("Unhandled application error:", error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        An unexpected error occurred. You can try again, or return to the homepage.
      </p>
      {error.digest ? (
        <p className="mt-1 font-mono text-[11px] text-slate-400">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary text-sm">
          Try again
        </button>
        <Link href="/" className="btn-secondary-light text-sm">
          Back to home
        </Link>
      </div>
    </div>
  )
}
