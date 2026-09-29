export function safeNextPath(next?: string | null) {
  if (!next) return null
  if (!next.startsWith("/") || next.startsWith("//")) return null
  if (next.startsWith("/login") || next.startsWith("/register")) return null
  return next
}

export function getPostLoginPath(roles: string[], next?: string | null) {
  const destination = safeNextPath(next)
  if (destination) return destination
  if (roles.includes("admin")) return "/admin"
  return "/dashboard"
}
