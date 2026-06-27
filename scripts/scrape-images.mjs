// Collect ALL distinct gallery images per product from the source pages.
// The JSON-LD crawl captured only 1 image; each product page has a gallery of
// 1-3 distinct full-size images (some are dimension diagrams). The product's
// gallery is identified by the GID embedded in its known image URL; only the
// product's OWN gallery appears as href="assets/galleries/<GID>/..." links
// (related-product galleries appear only as cache src=), so the GID filter is
// false-positive-free. Output: data/images.json = { [handle]: [scheme-less urls] }
import fs from "node:fs"

const catalog = JSON.parse(fs.readFileSync(new URL("../data/catalog-raw.json", import.meta.url)))
const OUT = new URL("../data/images.json", import.meta.url)
const CONCURRENCY = 12
const MAX_IMAGES = 6
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"

// galleries/<gid>/<base>(-WxH-hex)?.<ext>  -> gid + base (drop the resolution suffix)
const GID_RE = /galleries\/(\d+)\/([^/]+?)(?:-\d+x\d+-[0-9a-f]+)?\.(\w+)$/i
const stem = (file) => file.replace(/\.[^.]+$/, "")

function parseImages(html, gid, base, originalSchemeless) {
  const re = new RegExp(`href="(assets/galleries/${gid}/[^"]+\\.(?:jpg|jpeg|png|webp|gif))"`, "gi")
  const hrefs = []
  for (const m of html.matchAll(re)) hrefs.push(m[1])
  // dedupe, preserve order
  const seen = new Set()
  const uniq = hrefs.filter((h) => (seen.has(h) ? false : (seen.add(h), true)))
  if (!uniq.length) return [originalSchemeless] // gallery not in href form -> keep the known image

  // Put the original (stem === base) first so index 0 stays the current main image.
  const idx0 = uniq.findIndex((h) => stem(h.split("/").pop()) === base)
  let ordered
  if (idx0 >= 0) ordered = [uniq[idx0], ...uniq.filter((_, i) => i !== idx0)]
  else ordered = [`assets/galleries/${gid}/${base}.jpg`, ...uniq] // synthesize index 0

  // scheme-less form (matches the uploader's absUrl contract), dedupe, cap
  const out = []
  const s2 = new Set()
  for (const h of ordered) {
    const u = `waterstore.ae/${h}`
    if (!s2.has(u)) { s2.add(u); out.push(u) }
    if (out.length >= MAX_IMAGES) break
  }
  return out
}

async function fetchHtml(url, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 20000)
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: ctrl.signal })
      clearTimeout(t)
      if (!r.ok) continue
      return await r.text()
    } catch {
      /* retry */
    }
  }
  return null
}

const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity
const result = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT)) : {}
let done = 0
let multi = 0
const queue = catalog.filter((p) => !result[p.handle]).slice(0, Number.isFinite(LIMIT) ? LIMIT : undefined) // resume

async function worker() {
  while (queue.length) {
    const p = queue.shift()
    const original = p.images?.[0] || ""
    const m = original.match(GID_RE)
    if (!m) {
      if (original) result[p.handle] = [original] // keep whatever we have
    } else {
      const [, gid, base] = m
      const html = await fetchHtml(p.url)
      if (html) {
        const imgs = parseImages(html, gid, base, original)
        result[p.handle] = imgs
        if (imgs.length > 1) multi++
      } else {
        result[p.handle] = [original] // fetch failed -> keep known image
      }
    }
    done++
    if (done % 200 === 0) {
      fs.writeFileSync(OUT, JSON.stringify(result))
      console.log(`[${done}/${queue.length + done}] ${multi} products with >1 image`)
    }
  }
}

console.log(`Scraping gallery images for ${queue.length} products (concurrency ${CONCURRENCY})...`)
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
fs.writeFileSync(OUT, JSON.stringify(result))
const total = Object.keys(result).length
const withMulti = Object.values(result).filter((a) => a.length > 1).length
console.log(`DONE: ${total} products, ${withMulti} with multiple images -> ${OUT.pathname}`)
