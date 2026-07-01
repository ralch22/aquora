// Parse the existing Pool Care / guide link hrefs into a /store/search browse query, so the
// same category/search links that already power the text pills can drive real product cards.
// Centralises the three link shapes used across guides.ts, the problem solver and the dosing
// calculator: `/search?cat=<Name>`, `/search?q=<text>`, and `/categories/<handle>`.

// The 5 equipment handles that link via /categories/<handle> — mapped to the Retail category
// NAME that /store/search filters on (cat=). Verified against the live catalogue facets.
const HANDLE_TO_CATEGORY_NAME: Record<string, string> = {
  "pool-pumps": "Pool Pumps",
  "pool-filtration-systems": "Pool Filtration Systems",
  "pool-heaters": "Pool Heaters",
  "pool-cleaners": "Pool Cleaners and Accessories",
  "pool-lighting": "LED pool lights",
}

export function parseSource(href: string): { cat?: string; q?: string } {
  if (!href) return {}
  try {
    const url = new URL(href, "https://x")
    if (url.pathname.includes("/categories/")) {
      const handle = url.pathname.split("/categories/")[1]?.split("/")[0]
      const name = handle ? HANDLE_TO_CATEGORY_NAME[handle] : undefined
      return name ? { cat: name } : {}
    }
    const cat = url.searchParams.get("cat")
    if (cat) return { cat }
    const q = url.searchParams.get("q")
    if (q) return { q }
    return {}
  } catch {
    return {}
  }
}
