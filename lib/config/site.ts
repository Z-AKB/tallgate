const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const siteConfig = {
  name: "TallGate",
  legalName: "TallGate Computing Enterprise",
  tagline: "Technology Partner for African Enterprises & Startups",
  description:
    "Enterprise software development, cloud infrastructure, cybersecurity, business automation, and hands-on technology training based in Abuja, Nigeria.",
  registration: "Registered in Nigeria",
  url: siteUrl,
  email: "tallgatecomputing@gmail.com",
  phone: {
    display: "+234 913 189 8566",
    href: "tel:+2349131898566",
    whatsapp: "https://wa.me/2349131898566",
    whatsappPrefilled:
      "https://wa.me/2349131898566?text=Hello%20TallGate%2C%20I%20would%20like%20to%20inquire%20about%20your%20services",
  },
  address: {
    street: "No. 2 F.O. Eburuche Close, Gbazango Extension",
    area: "Kubwa, Abuja",
    country: "Nigeria",
    short: "Kubwa, Abuja, Nigeria",
  },
  social: {
    x: "https://x.com/tallgate_ng",
    xHandle: "@tallgate_ng",
    instagram: "https://www.instagram.com/tallgate_computing",
  },
} as const

export type SiteConfig = typeof siteConfig
