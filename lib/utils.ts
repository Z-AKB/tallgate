export function isValidEmailAddress(value: unknown): value is string {
  if (typeof value !== "string") return false

  const email = value.trim()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
