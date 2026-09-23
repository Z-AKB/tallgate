"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function ProgressBarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Reset/Complete progress bar on route change
  useEffect(() => {
    if (isNavigating) {
      setProgress(100)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsNavigating(false)
        setProgress(0)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams, isNavigating])

  // Listen to clicks on links to start progress immediately
  useEffect(() => {
    let progressInterval: NodeJS.Timeout

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return

      const href = target.getAttribute("href")
      if (!href) return

      // Ignore external links, hash anchors on current page, modifier keys, or new tab links
      const isExternal = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")
      const isAnchor = href.startsWith("#")
      const isSamePageAnchor = href.includes("#") && href.split("#")[0] === window.location.pathname
      const isNewTab = target.getAttribute("target") === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey

      if (isExternal || isAnchor || isSamePageAnchor || isNewTab) {
        return
      }

      // Check if target is already the current route
      const currentFullUrl = window.location.pathname + window.location.search
      if (href === currentFullUrl || href === window.location.pathname) {
        return
      }

      // Start navigation indicator immediately
      setIsNavigating(true)
      setIsVisible(true)
      setProgress(25)

      clearInterval(progressInterval)
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval)
            return 85
          }
          return prev + Math.floor(Math.random() * 15 + 10)
        })
      }, 150)
    }

    document.addEventListener("click", handleClick, { capture: true })

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      clearInterval(progressInterval)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[3px] bg-transparent overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.9)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 150ms ease-out, opacity 250ms ease 100ms" : "width 200ms ease-out",
        }}
      />
    </div>
  )
}

export default function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarContent />
    </Suspense>
  )
}
