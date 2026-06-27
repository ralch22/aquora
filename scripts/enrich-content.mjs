// Generate ORIGINAL, spec-grounded marketing copy for every product (and, in
// --mode=categories, a buyer's-guide intro per top category) using Vertex Gemini.
//
// IP-safe: the model is fed ONLY factual data (title, brand, leaf category,
// scraped spec name/value pairs). The source's marketing `description` is NEVER
// passed in. Output is original content.
//
//   node scripts/enrich-content.mjs                 # all products, resumable
//   LIMIT=25 node scripts/enrich-content.mjs        # sample (QA gate)
//   FORCE=1 node scripts/enrich-content.mjs         # ignore checkpoint, regenerate
//   MODE=categories node scripts/enrich-content.mjs # category intros
//
// Auth is drift-proof: this Mac's ADC drifts to the SES project, so we mint a
// token for a SPECIFIC gcloud account and HARD-ABORT unless it is the Emerge one.
import fs from "node:fs"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const pexec = promisify(exec)
const ACCOUNT = process.env.GCP_ACCOUNT || "rami@emergedigital.com"
const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034"
const LOCATION = process.env.GCP_LOCATION || "global"
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash"
const CONCURRENCY = Number(process.env.CONCURRENCY || 10)
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity
const FORCE = !!process.env.FORCE
const MODE = process.env.MODE || "products"

const dataUrl = (f) => new URL(`../data/${f}`, import.meta.url)
const readJson = (f) => JSON.parse(fs.readFileSync(dataUrl(f), "utf-8"))

// ---- drift-proof auth -------------------------------------------------------
async function assertIdentity() {
  const { stdout } = await pexec(`gcloud config get-value account 2>/dev/null`)
  const acct = stdout.trim()
  if (acct !== ACCOUNT) {
    throw new Error(
      `gcloud active account is "${acct}", expected "${ACCOUNT}". ` +
        `Run: gcloud config set account ${ACCOUNT}  (ADC on this Mac drifts to SES — aborting to avoid the wrong project).`
    )
  }
  console.log(`auth ok: ${acct}`)
}
let tok = { token: "", exp: 0 }
async function getToken() {
  const now = Date.now()
  if (tok.token && now < tok.exp) return tok.token
  const { stdout } = await pexec(`gcloud auth print-access-token --account=${ACCOUNT}`, { maxBuffer: 1 << 20 })
  tok = { token: stdout.trim(), exp: now + 50 * 60 * 1000 }
  return tok.token
}

// ---- Gemini call ------------------------------------------------------------
const URL_GEN = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`

async function gen(system, user, maxTokens = 600) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const token = await getToken()
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 40000)
      const r = await fetch(URL_GEN, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
        signal: ctrl.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          // thinkingBudget 0 disables 2.5-flash "thinking" (it otherwise eats the
          // output-token budget and truncates the JSON).
          generationConfig: { temperature: 0.4, maxOutputTokens: maxTokens, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
        }),
      })
      clearTimeout(t)
      if (r.status === 401) { tok = { token: "", exp: 0 }; continue } // refresh + retry
      const data = await r.json()
      if (!r.ok) {
        const msg = data?.error?.message || JSON.stringify(data).slice(0, 160)
        if (r.status === 429 || r.status === 503) { await sleep(800 * (attempt + 1)); continue }
        throw new Error(`HTTP ${r.status}: ${msg}`)
      }
      const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).filter(Boolean).join("").trim()
      if (!text) { await sleep(500 * (attempt + 1)); continue }
      return text
    } catch (e) {
      if (attempt === 2) throw e
      await sleep(600 * (attempt + 1))
    }
  }
  throw new Error("exhausted retries")
}
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

function parseJson(text) {
  // JSON mode returns clean JSON, but strip stray fences just in case.
  const t = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()
  return JSON.parse(t)
}

// ---- product enrichment -----------------------------------------------------
const SYSTEM_PRODUCT =
  `You are a senior product copywriter for Aquora, a premium UAE/GCC supplier of pool, spa, pond and fountain equipment. ` +
  `Write ORIGINAL, factual, on-brand copy in clear UAE English. You are given ONLY structured facts (title, brand, category, specification name/value pairs). ` +
  `Write strictly from those facts. NEVER invent specifications, model numbers, certifications, warranties, prices, or performance claims that are not in the facts. ` +
  `Do NOT use filler like "contact our team", "bulk pricing", "after-sales support", or empty superlatives ("ultimate", "best-in-class"). ` +
  `Return ONLY valid minified JSON, no markdown.`

function brandFromTitle(title) {
  const first = (title || "").trim().split(/[\s,]/)[0] || ""
  return /^[A-Z][A-Za-z0-9'’.&-]{1,}$/.test(first) ? first : ""
}

function productUser(title, brand, leaf, specs) {
  const specLines = (specs || []).map((s) => `- ${s.name}: ${s.value}`).join("\n") || "- (none provided)"
  return (
    `FACTS\n` +
    `Title: ${title}\n` +
    `Brand: ${brand || "unspecified"}\n` +
    `Category: ${leaf || "Pool & spa equipment"}\n` +
    `Specifications:\n${specLines}\n\n` +
    `Write JSON with exactly these keys:\n` +
    `{"overview": "...", "features": ["...","..."], "idealFor": "..."}\n` +
    `- overview: 2-3 sentences (~35-60 words) describing what this product is and does, referencing the real specs ` +
    `(e.g. flow rate, power, recommended pool volume) where useful. Specific to this product. No boilerplate, no call-to-action.\n` +
    `- features: 4-6 concise benefit bullets, each <=12 words, each grounded in a spec or the category. Do not restate the title verbatim. No duplicates.\n` +
    `- idealFor: one short line (<=16 words) naming the use-case, pool size or setting this product suits.`
  )
}

function validProduct(o) {
  return (
    o && typeof o.overview === "string" && o.overview.length >= 20 && o.overview.length <= 700 &&
    Array.isArray(o.features) && o.features.length >= 3 && o.features.length <= 8 &&
    o.features.every((f) => typeof f === "string" && f.length > 0 && f.length <= 120) &&
    typeof o.idealFor === "string" && o.idealFor.length <= 180
  )
}

async function runProducts() {
  const catalog = readJson("catalog-raw.json")
  const specs = readJson("specs.json")
  const cats = readJson("categories.json")
  const OUT = dataUrl("enrichment.json")

  const result = FORCE ? {} : (fs.existsSync(OUT) ? readJson("enrichment.json") : {})
  const pending = catalog.filter((p) => {
    const e = result[p.handle]
    return !e || e.__error // (re)do missing or previously-errored
  }).slice(0, Number.isFinite(LIMIT) ? LIMIT : undefined)

  console.log(`products: ${catalog.length} total, ${Object.keys(result).length} already done, ${pending.length} to generate (concurrency ${CONCURRENCY})`)
  let done = 0, ok = 0, err = 0
  const queue = [...pending]

  async function worker() {
    while (queue.length) {
      const p = queue.shift()
      const leaf = (cats[p.handle] || []).slice(-1)[0]?.name || ""
      const brand = brandFromTitle(p.name)
      try {
        let text = await gen(SYSTEM_PRODUCT, productUser(p.name, brand, leaf, specs[p.handle]))
        let obj = parseJson(text)
        if (!validProduct(obj)) {
          // one stricter retry
          text = await gen(SYSTEM_PRODUCT, productUser(p.name, brand, leaf, specs[p.handle]) + `\nReturn ONLY the JSON object with the three keys.`)
          obj = parseJson(text)
        }
        if (validProduct(obj)) {
          result[p.handle] = { overview: obj.overview.trim(), features: obj.features.map((f) => f.trim()).slice(0, 6), idealFor: (obj.idealFor || "").trim() }
          ok++
        } else {
          result[p.handle] = { __error: "validation" }
          err++
        }
      } catch (e) {
        result[p.handle] = { __error: String(e?.message || e).slice(0, 120) }
        err++
      }
      done++
      if (done % 100 === 0) {
        fs.writeFileSync(OUT, JSON.stringify(result))
        console.log(`[${done}/${pending.length}] ok=${ok} err=${err}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  fs.writeFileSync(OUT, JSON.stringify(result))
  const errs = Object.values(result).filter((v) => v && v.__error).length
  console.log(`DONE products: ok=${ok} err=${err} | total enriched ${Object.keys(result).length - errs}, ${errs} errored -> ${OUT.pathname}`)
}

// ---- category intros --------------------------------------------------------
const SYSTEM_CATEGORY =
  `You are a senior copywriter for Aquora, a premium UAE/GCC pool, spa, pond and fountain equipment supplier. ` +
  `Write an ORIGINAL, factual category intro in clear UAE English, grounded only in the category name and the sample product titles/brands provided. ` +
  `No invented claims, no filler, no superlatives. Return ONLY valid minified JSON.`

async function runCategories() {
  const catalog = readJson("catalog-raw.json")
  const cats = readJson("categories.json")
  const OUT = dataUrl("category-intros.json")

  // Top category (first node) -> sample of product titles + brand set.
  const byTop = {}
  for (const p of catalog) {
    const path = cats[p.handle]
    if (!path?.length) continue
    const top = path[0]
    const k = top.slug
    ;(byTop[k] ||= { name: top.name, slug: top.slug, titles: [], brands: new Set() })
    if (byTop[k].titles.length < 14) byTop[k].titles.push(p.name)
    const b = brandFromTitle(p.name)
    if (b) byTop[k].brands.add(b)
  }
  const result = FORCE ? {} : (fs.existsSync(OUT) ? readJson("category-intros.json") : {})
  const entries = Object.values(byTop).filter((c) => !result[c.slug])
  console.log(`categories: ${Object.keys(byTop).length} top categories, ${entries.length} to generate`)

  for (const c of entries) {
    const user =
      `CATEGORY: ${c.name}\n` +
      `Brands seen: ${[...c.brands].slice(0, 10).join(", ") || "various"}\n` +
      `Sample products:\n${c.titles.map((t) => `- ${t}`).join("\n")}\n\n` +
      `Write JSON: {"intro": "..."} where intro is 2-3 sentences (~40-65 words) describing what this equipment category covers, ` +
      `what to consider when choosing, and the range Aquora stocks for UAE/GCC pools, spas and water features. Specific, factual, no filler, no CTA.`
    try {
      const obj = parseJson(await gen(SYSTEM_CATEGORY, user, 300))
      if (obj?.intro && typeof obj.intro === "string" && obj.intro.length > 30) {
        result[c.slug] = { name: c.name, intro: obj.intro.trim() }
        console.log(`  ok: ${c.name}`)
      }
    } catch (e) {
      console.log(`  ERR ${c.name}: ${String(e?.message || e).slice(0, 80)}`)
    }
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2))
  }
  console.log(`DONE categories: ${Object.keys(result).length} -> ${OUT.pathname}`)
}

// ---- main -------------------------------------------------------------------
await assertIdentity()
if (MODE === "categories") await runCategories()
else await runProducts()
