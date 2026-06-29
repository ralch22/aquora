import { MetadataRoute } from "next"
import { listBlogSlugs } from "./[countryCode]/(main)/blog/_lib/markdown"
import { listGuides } from "@lib/aquora/guides"

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const CC = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ae"

async function fetchAllHandles(resource: string, key: string): Promise<string[]> {
  const handles: string[] = []
  let offset = 0
  const limit = 1000
  try {
    while (offset < 20000) {
      const r = await fetch(
        `${BACKEND}/store/${resource}?fields=handle&limit=${limit}&offset=${offset}`,
        { headers: { "x-publishable-api-key": KEY }, cache: "no-store" }
      )
      if (!r.ok) break
      const data = await r.json()
      const arr: any[] = data[key] || []
      for (const x of arr) if (x?.handle) handles.push(x.handle)
      if (arr.length < limit) break
      offset += limit
    }
  } catch {}
  return handles
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPaths = [
    "", "store", "brands", "services", "about", "blog", "faq", "search", "contact",
    "pool-care", "guides", "pool-dosing-calculator", "pool-problem-solver", "pool-sizing-guide",
    "legal/terms", "legal/privacy", "legal/returns", "legal/shipping", "legal/cookies",
  ]
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${BASE}/${CC}${p ? `/${p}` : ""}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6,
  }))

  const [products, categories] = await Promise.all([
    fetchAllHandles("products", "products"),
    fetchAllHandles("product-categories", "product_categories"),
  ])

  for (const slug of listBlogSlugs()) {
    entries.push({ url: `${BASE}/${CC}/blog/${slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.5 })
  }
  for (const g of listGuides()) {
    entries.push({ url: `${BASE}/${CC}/guides/${g.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 })
  }
  for (const handle of categories) {
    entries.push({ url: `${BASE}/${CC}/categories/${handle}`, lastModified: now, changeFrequency: "weekly", priority: 0.7 })
  }
  for (const handle of products) {
    entries.push({ url: `${BASE}/${CC}/products/${handle}`, lastModified: now, changeFrequency: "weekly", priority: 0.5 })
  }

  return entries
}
