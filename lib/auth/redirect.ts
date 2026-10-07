export function safeNextPath(next?: string | null) {
  if (!next?.startsWith("/") || next.startsWith("//")) return null

  const baseUrl = "https://tallgate.invalid"
  const destination = new URL(next, baseUrl)
  if (destination.origin !== baseUrl) return null

  const path = `${destination.pathname}${destination.search}${destination.hash}`
  if (path.startsWith("/login") || path.startsWith("/register")) return null
  return path
}

export function getPostLoginPath(roles: string[], next?: string | null) {
  const destination = safeNextPath(next)
  if (destination) return destination
  if (roles.includes("admin")) return "/admin"
  return "/dashboard"
}
