// Approval-gated competitor pricing research — multi-source, brand-routed.
// Validated sources: Noon.com (stealth proxy) → AED for consumer brands; EU retailer
// (poolsana.de) → EUR for AstralPool/Speck/Espa/metric; US retailer (inyopools) → USD for
// Hayward/Pentair. Proposes AED = localAED×1.15, or (EUR/USD × FX × IMPORT) × 1.15.
// Sanity-bounded + confidence-scored. NEVER applies prices. Run: LIMIT=8 node scripts/pricing-research.mjs
import fs from "node:fs"

const KEY = (fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/FIRECRAWL_API_KEY=(.+)/) || [])[1]?.trim()
if (!KEY) throw new Error("FIRECRAWL_API_KEY missing")
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }

const FX = { USD: Number(process.env.FX_USD || 3.6725), EUR: Number(process.env.FX_EUR || 3.95), AED: 1 }
const IMPORT_FACTOR = Number(process.env.IMPORT_FACTOR || 1.4) // landed adj for non-AED sources
const MARKUP = Number(process.env.MARKUP || 0.15)
const MIN_CONF = Number(process.env.MIN_CONF || 0.45)
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : 8

const catalog = JSON.parse(fs.readFileSync(new URL("../data/catalog-raw.json", import.meta.url)))
const US_BRANDS = ["Hayward", "Pentair", "Jandy", "Polaris", "Waterway"]
const EU_BRANDS = ["AstralPool", "Astral", "Speck", "Espa", "Zodiac", "Behncke", "Bonded", "Fluvo"]
const CONSUMER = ["Bestway", "Intex", "Aqua", "Gre", "Steinbach"]
const ALL = [...US_BRANDS, ...EU_BRANDS, ...CONSUMER]
const brandOf = (n) => ALL.find((b) => new RegExp(`\\b${b}\\b`, "i").test(n)) || ""
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2)
const sim = (a, b) => { const A = new Set(norm(a)), B = new Set(norm(b)); const i = [...A].filter((x) => B.has(x)).length; return i / Math.max(1, Math.min(A.size, B.size)) }

function routeFor(name) {
  const b = brandOf(name)
  if (US_BRANDS.includes(b)) return { src: "US", retailer: "https://www.inyopools.com", cur: "USD" }
  if (EU_BRANDS.includes(b)) return { src: "EU", retailer: "https://www.poolsana.de", cur: "EUR" }
  return { src: "NOON", retailer: "https://www.noon.com", cur: "AED" }
}

async function fc(path, body) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 90000)
  try { const r = await fetch(`https://api.firecrawl.dev/v2/${path}`, { method: "POST", headers: H, signal: c.signal, body: JSON.stringify(body) }); clearTimeout(t); return await r.json() } catch { clearTimeout(t); return null }
}
const LIST_SCHEMA = { type: "object", properties: { products: { type: "array", items: { type: "object", properties: { name: { type: "string" }, brand: { type: "string" }, price: { type: "number" } }, required: ["name"] } } } }

async function lookup(product) {
  const route = routeFor(product.name)
  const brand = brandOf(product.name)
  const terms = norm(product.name).filter((w) => !ALL.map((b) => b.toLowerCase()).includes(w)).slice(0, 4)
  const query = [brand, ...terms].join(" ").trim()

  if (route.src === "NOON") {
    const url = `https://www.noon.com/uae-en/search/?q=${encodeURIComponent(query)}`
    const j = await fc("scrape", { url, onlyMainContent: true, proxy: "stealth", formats: [{ type: "json", schema: LIST_SCHEMA, prompt: "Each product result: name, brand, numeric AED price." }] })
    const prods = (j?.data?.json?.products || []).filter((p) => p.price)
    const best = prods.map((p) => ({ ...p, c: sim(product.name, p.name) })).sort((a, b) => b.c - a.c)[0]
    if (!best) return null
    return { ...route, source_name: best.name, price: best.price, confidence: Number(best.c.toFixed(2)), url }
  }
  // EU / US: map → scrape product page
  const m = await fc("map", { url: route.retailer, search: query, limit: 8 })
  const links = (m?.links || []).map((l) => (typeof l === "string" ? l : l.url)).filter((u) => /produkt|product|partlisting|\/p\//i.test(u) || u.split("/").length > 3)
  if (!links.length) return null
  const url = links[0]
  const j = await fc("scrape", { url, onlyMainContent: true, formats: [{ type: "json", schema: { type: "object", properties: { name: { type: "string" }, brand: { type: "string" }, price: { type: "number" } } }, prompt: "The MAIN product's name, brand, and headline price (number only, ignore spare-part prices)." }] })
  const p = j?.data?.json
  if (!p?.price) return null
  return { ...route, source_name: p.name, price: p.price, confidence: Number(sim(product.name, p.name).toFixed(2)), url }
}

const OUT = new URL("../data/price-proposals.json", import.meta.url)
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {}
const pending = catalog.filter((p) => brandOf(p.name) && !out[p.handle] && (!process.env.BRAND || new RegExp(process.env.BRAND, "i").test(p.name))).slice(0, LIMIT)
console.log(`pricing-research (multi-source): ${pending.length} products | FX ${JSON.stringify(FX)} import x${IMPORT_FACTOR} markup +${MARKUP * 100}% minConf ${MIN_CONF}`)

for (const p of pending) {
  const r = await lookup(p)
  if (r && r.confidence >= MIN_CONF) {
    const aedBasis = r.cur === "AED" ? r.price : r.price * FX[r.cur] * IMPORT_FACTOR
    const proposed = Math.round(aedBasis * (1 + MARKUP))
    out[p.handle] = { title: p.name, source: r.src, source_name: r.source_name, price: r.price, currency: r.cur, confidence: r.confidence, url: r.url, proposed_aed: proposed }
    console.log(`\n[${r.src}] ${p.name}\n   ${r.source_name} ${r.price} ${r.cur} (conf ${r.confidence}) -> proposed AED ${proposed}`)
  } else {
    console.log(`\n[${routeFor(p.name).src}] ${p.name}\n   no confident match (${r ? "conf " + r.confidence : "no result"})`)
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2))
}
const ok = Object.values(out).filter((v) => v.proposed_aed).length
console.log(`\nDONE: ${ok} confident priced proposals -> data/price-proposals.json`)
