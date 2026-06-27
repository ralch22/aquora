// On-demand market-price intelligence. Given a product query (or an Aquora handle),
// pulls the best public prices from the validated sources — Noon.com (stealth) in AED,
// EU retailer (poolsana.de) in EUR, US retailer (inyopools) in USD — converts to AED, and
// shows a suggested retail at +15%. For pricing decisions / supplier-negotiation leverage;
// it never changes catalogue prices. Usage:
//   node scripts/price-lookup.mjs "AstralPool Aster 600 sand filter"
//   node scripts/price-lookup.mjs --handle hayward-proseries-hb-top-mounted-sand-filter-for-pool-511-mm-10-m3h
import fs from "node:fs"

const KEY = (fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/FIRECRAWL_API_KEY=(.+)/) || [])[1]?.trim()
if (!KEY) throw new Error("FIRECRAWL_API_KEY missing")
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }

const FX = { USD: Number(process.env.FX_USD || 3.6725), EUR: Number(process.env.FX_EUR || 3.95), AED: 1 }
const IMPORT_FACTOR = Number(process.env.IMPORT_FACTOR || 1.4)
const MARKUP = Number(process.env.MARKUP || 0.15)

const args = process.argv.slice(2)
let query = args.join(" ").trim()
if (args[0] === "--handle") {
  const handle = args[1]
  const cat = JSON.parse(fs.readFileSync(new URL("../data/catalog-raw.json", import.meta.url)))
  const p = cat.find((x) => x.handle === handle)
  if (!p) { console.error("handle not found:", handle); process.exit(1) }
  query = p.name.replace(/&quot;/g, '"')
}
if (!query) { console.error('Usage: node scripts/price-lookup.mjs "<product query>"  |  --handle <handle>'); process.exit(1) }

const US_BRANDS = ["Hayward", "Pentair", "Jandy", "Polaris", "Waterway"]
const EU_BRANDS = ["AstralPool", "Astral", "Speck", "Espa", "Zodiac", "Behncke", "Fluvo"]
const ALL = [...US_BRANDS, ...EU_BRANDS, "Bestway", "Intex"]
const brandOf = (n) => ALL.find((b) => new RegExp(`\\b${b}\\b`, "i").test(n)) || ""
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2)
const sim = (a, b) => { const A = new Set(norm(a)), B = new Set(norm(b)); const i = [...A].filter((x) => B.has(x)).length; return Number((i / Math.max(1, Math.min(A.size, B.size))).toFixed(2)) }

async function fc(path, body) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 90000)
  try { const r = await fetch(`https://api.firecrawl.dev/v2/${path}`, { method: "POST", headers: H, signal: c.signal, body: JSON.stringify(body) }); clearTimeout(t); return await r.json() } catch { clearTimeout(t); return null }
}
const SCHEMA = { type: "object", properties: { products: { type: "array", items: { type: "object", properties: { name: { type: "string" }, brand: { type: "string" }, price: { type: "number" } }, required: ["name"] } } } }

const brand = brandOf(query)
const terms = [brand, ...norm(query).filter((w) => !ALL.map((b) => b.toLowerCase()).includes(w)).slice(0, 5)].join(" ").trim()

// Decide which sources to hit (always Noon for a local read; the brand's home region too)
const noonUrl = `https://www.noon.com/uae-en/search/?q=${encodeURIComponent(terms)}`
const SOURCES = []
SOURCES.push({ src: "NOON", cur: "AED", pageUrl: noonUrl, scrape: () => fc("scrape", { url: noonUrl, onlyMainContent: true, proxy: "stealth", formats: [{ type: "json", schema: SCHEMA, prompt: "Each result: name, brand, numeric AED price." }] }) })
if (US_BRANDS.includes(brand) || !brand) SOURCES.push({ src: "US (inyopools)", cur: "USD", scrape: () => mapScrape("https://www.inyopools.com") })
if (EU_BRANDS.includes(brand) || !brand) SOURCES.push({ src: "EU (poolsana)", cur: "EUR", scrape: () => mapScrape("https://www.poolsana.de") })

async function mapScrape(retailer) {
  const m = await fc("map", { url: retailer, search: terms, limit: 6 })
  const links = (m?.links || []).map((l) => (typeof l === "string" ? l : l.url)).filter((u) => /produkt|product|partlisting|\/p\//i.test(u))
  const out = []
  for (const url of links.slice(0, 2)) {
    const j = await fc("scrape", { url, onlyMainContent: true, formats: [{ type: "json", schema: { type: "object", properties: { name: { type: "string" }, brand: { type: "string" }, price: { type: "number" } } }, prompt: "MAIN product name, brand, headline price (number; ignore spare-part prices)." }] })
    const p = j?.data?.json
    if (p?.price) out.push({ ...p, url })
  }
  return { data: { json: { products: out } } }
}

console.log(`\n🔎  Market price lookup: "${query}"  (brand: ${brand || "—"})\n`)
const rows = []
for (const s of SOURCES) {
  const j = await s.scrape()
  const prods = (j?.data?.json?.products || []).filter((p) => p.price)
  for (const p of prods) {
    const aed = s.cur === "AED" ? p.price : Math.round(p.price * FX[s.cur] * IMPORT_FACTOR)
    rows.push({ src: s.src, name: p.name, price: p.price, cur: s.cur, aed, suggested: Math.round(aed * (1 + MARKUP)), conf: sim(query, p.name), url: p.url || s.pageUrl || "" })
  }
}
rows.sort((a, b) => b.conf - a.conf)
if (!rows.length) { console.log("  No public prices found for this query."); process.exit(0) }
for (const r of rows.slice(0, 8)) {
  console.log(`  [${r.src}] conf ${r.conf}  ${r.name.slice(0, 70)}`)
  console.log(`     ${r.price} ${r.cur}  ≈ AED ${r.aed}   → suggested retail (×${1 + MARKUP}): AED ${r.suggested}`)
  if (r.url) console.log(`     ${r.url}`)
}
console.log(`\n(non-AED converted at FX USD ${FX.USD} / EUR ${FX.EUR}, landed ×${IMPORT_FACTOR}; suggested = market × ${1 + MARKUP})`)
