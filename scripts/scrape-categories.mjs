// Scrape the real category breadcrumb from each source product page so we can rebuild
// the source's actual category taxonomy (factual structural data, not copyrightable).
// Output: data/categories.json = { [handle]: [{name, slug}, ...] }  (root dropped, L1..Ln)
import fs from "node:fs"

const catalog = JSON.parse(fs.readFileSync(new URL("../data/catalog-raw.json", import.meta.url)))
const OUT = new URL("../data/categories.json", import.meta.url)
const CONCURRENCY = 12
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

const ROOT_SLUG = "pool-and-spa-equipment" // universal catalog root — drop it

const strip = (s) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&deg;/g, "°")
    .replace(/&nbsp;/g, " ")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const titleFromSlug = (slug) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

function extractCategories(html) {
  const m = html.match(/<section class="breadcrumbs">([\s\S]*?)<\/section>/i)
  if (!m) return null
  const links = [...m[1].matchAll(/<a\s+href="(\/[^"]*?)"[^>]*>([\s\S]*?)<\/a>/g)]
  const path = []
  const seen = new Set()
  for (const lk of links) {
    const segs = lk[1].split("/").filter(Boolean)
    const slug = segs[segs.length - 1]
    if (!slug || slug === ROOT_SLUG) continue
    if (seen.has(slug)) continue
    seen.add(slug)
    let name = strip(lk[2])
    // Guard against CSS-truncated text: if the rendered text looks cut off vs the slug,
    // fall back to a title-cased slug.
    if (!name || name.length < 3) name = titleFromSlug(slug)
    path.push({ name, slug })
  }
  return path.length ? path : null
}

async function fetchCats(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 20000)
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: ctrl.signal })
      clearTimeout(t)
      if (!r.ok) continue
      return extractCategories(await r.text())
    } catch {
      // retry
    }
  }
  return null
}

const result = {}
let done = 0
let withCats = 0
const queue = [...catalog]

async function worker() {
  while (queue.length) {
    const p = queue.shift()
    const cats = await fetchCats(p.url)
    done++
    if (cats && cats.length) {
      result[p.handle] = cats
      withCats++
    }
    if (done % 200 === 0) {
      console.log(`[${done}/${catalog.length}] ${withCats} with categories`)
      fs.writeFileSync(OUT, JSON.stringify(result))
    }
  }
}

console.log(`Scraping category breadcrumbs for ${catalog.length} products (concurrency ${CONCURRENCY})...`)
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
fs.writeFileSync(OUT, JSON.stringify(result))
console.log(`DONE: ${withCats}/${catalog.length} products have categories -> ${OUT.pathname}`)
