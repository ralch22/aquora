import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"

// Crawlability: allow indexing of catalogue/content, keep user-specific and transactional
// routes out of the index, and point crawlers at the sitemap on the canonical host.
export default function robots(): MetadataRoute.Robots {
  const base = getBaseURL()
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/account",
          "/*/checkout",
          "/*/cart",
          "/*/wishlist",
          "/*/order/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
