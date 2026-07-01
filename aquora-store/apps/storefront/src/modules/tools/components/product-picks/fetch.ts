import { parseSource } from "@lib/aquora/product-source"

export type PickCard = {
  handle: string
  title: string
  thumbnail?: string | null
  category?: string | null
  price?: number | null
}

// Reuses the live /store/search browse endpoint (the runSearch pattern from the search page) —
// callable identically server- or client-side. Returns up to `limit` REAL catalogue cards for a
// source href, or [] on any failure / no source (so every placement self-hides honestly).
export async function fetchPicks(source: string, limit = 4): Promise<PickCard[]> {
  const { cat, q } = parseSource(source)
  if (!cat && !q) return []
  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  if (!base) return []
  const p = new URLSearchParams({ q: q || "", page: "1" })
  if (cat) p.set("cat", cat)
  try {
    const r = await fetch(`${base}/store/search?${p.toString()}`, {
      headers: { "x-publishable-api-key": key },
      cache: "no-store",
    })
    if (!r.ok) return []
    const data = await r.json()
    return (Array.isArray(data.products) ? data.products : []).slice(0, limit)
  } catch {
    return []
  }
}
