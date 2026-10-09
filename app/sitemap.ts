import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config/site"

const PUBLIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/services", priority: 0.8 },
  { path: "/learning-hub", priority: 0.8 },
  { path: "/startup-hub", priority: 0.8 },
  { path: "/portfolio", priority: 0.7 },
  { path: "/blog", priority: 0.6 },
  { path: "/events", priority: 0.6 },
  { path: "/contact", priority: 0.6 },
  { path: "/consultation", priority: 0.6 },
  { path: "/learn", priority: 0.7 },
  { path: "/learn/courses", priority: 0.7 },
  { path: "/startup-hub/apply", priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, "")
  const lastModified = new Date()

  return PUBLIC_ROUTES.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }))
}
