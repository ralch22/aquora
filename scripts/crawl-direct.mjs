#!/usr/bin/env node
// Crawl waterstore.ae product catalogue for FREE via direct fetch + JSON-LD parsing.
// Each product page exposes schema.org Product + BreadcrumbList JSON-LD.
// Usage: node scripts/crawl-direct.mjs [concurrency]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const REF = path.join(ROOT, "data", "reference");
const OUT = path.join(ROOT, "data", "catalog-raw.json");
const FAIL = path.join(REF, "crawl-failures.json");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const urls = JSON.parse(fs.readFileSync(path.join(REF, "product-urls.json"), "utf8"));
const CONC = parseInt(process.argv[2] || "24", 10);

function jsonLdBlocks(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { out.push(JSON.parse(m[1].trim())); } catch {}
  }
  // flatten @graph and arrays
  const flat = [];
  for (const b of out) {
    if (Array.isArray(b)) flat.push(...b);
    else if (b["@graph"]) flat.push(...b["@graph"]);
    else flat.push(b);
  }
  return flat;
}
const typeIs = (o, t) => { const v = o && o["@type"]; return Array.isArray(v) ? v.some(x => new RegExp(t, "i").test(x)) : new RegExp(t, "i").test(v || ""); };

function parseProduct(html, url) {
  const blocks = jsonLdBlocks(html);
  const p = blocks.find(b => typeIs(b, "Product"));
  if (!p) return null;
  const brand = typeof p.brand === "object" ? p.brand?.name : p.brand;
  let images = p.image || [];
  if (typeof images === "string") images = [images];
  images = (images || []).filter(Boolean);
  const offers = Array.isArray(p.offers) ? p.offers[0] : p.offers;
  const price = offers ? Number(offers.price ?? 0) : 0;
  const currency = offers?.priceCurrency || "AED";
  const availability = offers?.availability || null;
  // category path from BreadcrumbList
  const crumb = blocks.find(b => typeIs(b, "BreadcrumbList"));
  let categoryPath = [];
  if (crumb?.itemListElement) {
    categoryPath = crumb.itemListElement
      .map(i => (i.name || i.item?.name || "").toString().trim())
      .filter(n => n && !/^home$/i.test(n));
    if (categoryPath.length) categoryPath = categoryPath.slice(0, -1); // drop the product itself
  }
  return {
    url,
    handle: url.replace(/^https?:\/\/[^/]+\//, "").replace(/\/+$/, ""),
    name: (p.name || "").toString().trim(),
    sku: p.sku || p.mpn || null,
    mpn: p.mpn || null,
    brand: brand || null,
    description: (p.description || "").toString().trim(),
    images,
    price,
    currency,
    availability,
    categoryPath,
  };
}

async function fetchOne(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, redirect: "follow" });
      if (!r.ok) { if (r.status === 404) return { skip: true }; throw new Error("HTTP " + r.status); }
      const html = await r.text();
      const prod = parseProduct(html, url);
      if (!prod || !prod.name) return { skip: true, reason: "no-product-schema" };
      return { prod };
    } catch (e) {
      if (i === tries - 1) return { error: String(e).slice(0, 120) };
      await new Promise(res => setTimeout(res, 400 * (i + 1)));
    }
  }
}

const results = [];
const failures = [];
let done = 0;
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const idx = cursor++;
    const url = urls[idx];
    const r = await fetchOne(url);
    if (r.prod) results.push(r.prod);
    else failures.push({ url, ...r });
    done++;
    if (done % 250 === 0) {
      console.log(`  ${done}/${urls.length}  ok=${results.length} fail=${failures.length}`);
      fs.writeFileSync(OUT, JSON.stringify(results));
    }
  }
}

console.log(`Crawling ${urls.length} products @ concurrency ${CONC} ...`);
await Promise.all(Array.from({ length: CONC }, worker));
fs.writeFileSync(OUT, JSON.stringify(results));
fs.writeFileSync(FAIL, JSON.stringify(failures, null, 0));
const withPrice = results.filter(r => r.price > 0).length;
const withImg = results.filter(r => r.images.length).length;
const brands = new Set(results.map(r => r.brand).filter(Boolean));
console.log(`DONE: ${results.length} products (${failures.length} failed). withImages=${withImg} withPrice=${withPrice} brands=${brands.size}`);
console.log(`saved -> ${OUT}`);
