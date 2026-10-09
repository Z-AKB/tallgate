import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/config/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/dashboard",
          "/api",
          "/auth",
          "/login",
          "/register",
          "/reset-password",
          "/forgot-password",
          "/verify-email",
          "/verify",
        ],
      },
    ],
    sitemap: `${siteConfig.url.replace(/\/$/, "")}/sitemap.xml`,
    host: siteConfig.url,
  }
}
