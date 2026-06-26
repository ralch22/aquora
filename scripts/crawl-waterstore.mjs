#!/usr/bin/env node
// Crawl waterstore.ae product catalogue via Firecrawl v2 batch-scrape.
// Usage: node scripts/crawl-waterstore.mjs <submit|poll|fetch>
// Source has NO prices (turnkey template) -> AED prices are generated at ingest time.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const REF = path.join(ROOT, "data", "reference");
const JOB_FILE = path.join(REF, "crawl-job.json");
const OUT_FILE = path.join(ROOT, "data", "catalog-raw.json");

// Load Firecrawl key from gitignored .env.local
const envText = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const KEY = (envText.match(/FIRECRAWL_API_KEY=(.+)/) || [])[1]?.trim();
if (!KEY) throw new Error("FIRECRAWL_API_KEY not found in .env.local");
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    brand: { type: "string" },
    category: { type: "string" },
    description: { type: "string" },
    sku: { type: "string" },
    in_stock: { type: "boolean" },
    specs: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
    image_urls: { type: "array", items: { type: "string" } },
  },
  required: ["title"],
};

async function submit() {
  const urls = JSON.parse(fs.readFileSync(path.join(REF, "product-urls.json"), "utf8"));
  console.log(`Submitting batch-scrape for ${urls.length} product URLs...`);
  const r = await fetch("https://api.firecrawl.dev/v2/batch/scrape", {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      urls,
      formats: [{ type: "json", schema: SCHEMA }],
      onlyMainContent: true,
      ignoreInvalidURLs: true,
    }),
  });
  const j = await r.json();
  if (!j.id && !j.url) { console.log("submit failed:", JSON.stringify(j).slice(0, 400)); process.exit(1); }
  fs.writeFileSync(JOB_FILE, JSON.stringify({ id: j.id, url: j.url, submittedCount: urls.length }, null, 2));
  console.log("job id:", j.id, "\nstatus url:", j.url);
}

async function status() {
  const { id } = JSON.parse(fs.readFileSync(JOB_FILE, "utf8"));
  const r = await fetch(`https://api.firecrawl.dev/v2/batch/scrape/${id}`, { headers: H });
  return await r.json();
}

async function poll() {
  const s = await status();
  console.log(`status=${s.status} completed=${s.completed}/${s.total} credits=${s.creditsUsed ?? "?"}`);
}

async function fetchAll() {
  // Page through all results (Firecrawl paginates large batches via `next`).
  const { id } = JSON.parse(fs.readFileSync(JOB_FILE, "utf8"));
  let url = `https://api.firecrawl.dev/v2/batch/scrape/${id}`;
  const items = [];
  let firstStatus = null;
  while (url) {
    const r = await fetch(url, { headers: H });
    const j = await r.json();
    firstStatus = firstStatus || j.status;
    for (const d of j.data || []) {
      const jd = d.json || {};
      if (jd.title) items.push({ ...jd, source_url: d.metadata?.sourceURL || d.metadata?.url || null });
    }
    url = j.next || null;
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 0));
  console.log(`status=${firstStatus} -> saved ${items.length} products to ${OUT_FILE}`);
}

const mode = process.argv[2] || "poll";
if (mode === "submit") await submit();
else if (mode === "poll") await poll();
else if (mode === "fetch") await fetchAll();
else console.log("usage: submit|poll|fetch");
