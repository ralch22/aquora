// Scrape factual specification tables (characteristic name/value pairs) from the
// source product pages. Specs are factual product data (not copyrightable creative
// content). Output: data/specs.json = { [handle]: [{name, value}] }
import fs from "node:fs"

const catalog = JSON.parse(fs.readFileSync(new URL("../data/catalog-raw.json", import.meta.url)))
const OUT = new URL("../data/specs.json", import.meta.url)
const CONCURRENCY = 12
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

const NAME_BLOCKLIST = new Set(["brand"])

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

function extractSpecs(html) {
  const items = [...html.matchAll(/<div class="characteristic__item"[\s\S]*?<\/div>\s*<\/div>/g)].map((m) => m[0])
  const seen = new Set()
  const specs = []
  for (const it of items) {
    const n = it.match(/characteristic__name[^>]*>([\s\S]*?)<\/(?:div|span|a)/)
    const v = it.match(/characteristic__value[^>]*>([\s\S]*?)<\/(?:div|span)/)
    if (!n || !v) continue
    const name = strip(n[1])
    const value = strip(v[1])
    if (!name || !value) continue
    const key = name.toLowerCase()
    if (NAME_BLOCKLIST.has(key)) continue
    if (name.length > 30 || value.length > 50) continue // drop category/desc noise
    if (seen.has(key)) continue
    seen.add(key)
    specs.push({ name, value })
    if (specs.length >= 12) break
  }
  return specs
}

async function fetchSpecs(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 20000)
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: ctrl.signal })
      clearTimeout(t)
      if (!r.ok) continue
      const html = await r.text()
      return extractSpecs(html)
    } catch {
      // retry
    }
  }
  return null
}

const result = {}
let done = 0
let withSpecs = 0
const queue = [...catalog]

async function worker() {
  while (queue.length) {
    const p = queue.shift()
    const specs = await fetchSpecs(p.url)
    done++
    if (specs && specs.length) {
      result[p.handle] = specs
      withSpecs++
    }
    if (done % 200 === 0) {
      console.log(`[${done}/${catalog.length}] ${withSpecs} with specs`)
      fs.writeFileSync(OUT, JSON.stringify(result))
    }
  }
}

console.log(`Scraping specs for ${catalog.length} products (concurrency ${CONCURRENCY})...`)
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
fs.writeFileSync(OUT, JSON.stringify(result))
console.log(`DONE: ${withSpecs}/${catalog.length} products have specs -> ${OUT.pathname}`)
