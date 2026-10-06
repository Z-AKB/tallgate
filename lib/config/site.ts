const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const whatsappNumber = "+2349131898566"

const whatsappDigits = whatsappNumber.replace(/\D/g, "")

const phoneDisplay = `+${whatsappDigits.slice(0, 3)} ${whatsappDigits.slice(3, 6)} ${whatsappDigits.slice(6, 9)} ${whatsappDigits.slice(9)}`

const addressLine1 = "No 2, F.O Eburuche Close"
const addressLine2 = "Gbazango Extension, FCT, Nigeria"

const rcNumber = "9365381"

export const siteConfig = {
  name: "TallGate",
  companyName: "TallGate Limited",
  rcNumber,
  tagline: "Opening Doors to Digital Growth.",
  description:
    "Enterprise software development, cloud infrastructure, cybersecurity, business automation, and hands-on technology training based in Abuja, Nigeria.",
  registration: `Registered in Nigeria. RC ${rcNumber}.`,
  url: siteUrl,
  supportEmail: "tallgatecomputing@gmail.com",
  whatsappNumber,
  whatsappLink: `https://wa.me/${whatsappDigits}`,
  phone: {
    display: phoneDisplay,
    href: `tel:+${whatsappDigits}`,
  },
  address: {
    line1: addressLine1,
    line2: addressLine2,
    short: addressLine2,
  },
  campus: "Kubwa, Abuja",
  social: {
    twitter: "https://x.com/tallgate_ng",
    twitterHandle: "@tallgate_ng",
    instagram: "https://www.instagram.com/tallgate_computing?stkn=bW1iNjMwdw2aGNw",
  },
} as const

export type SiteConfig = typeof siteConfig

export function whatsappPrefilledLink(message: string) {
  return `${siteConfig.whatsappLink}?text=${encodeURIComponent(message)}`
}