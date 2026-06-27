#!/usr/bin/env node
/**
 * Generate Aquora brand graphics via Nano Banana Pro (Gemini 3 Pro Image) on Vertex AI,
 * writing optimised WebP into the storefront's public/images/brand/.
 *
 *   node scripts/generate-graphics.mjs                 # DRY-RUN: print the plan
 *   node scripts/generate-graphics.mjs --only hero --run
 *   node scripts/generate-graphics.mjs --run           # generate all (slow; run in background)
 *   node scripts/generate-graphics.mjs --missing --run # only assets not already on disk
 *
 * Auth: gcloud access token for rami@emergedigital.com (drift-proof — ADC on this Mac
 * drifts to SES). Mirrors scripts/enrich-content.mjs + jpools generate-assets.mjs.
 */
import sharp from "sharp"
import { mkdirSync, existsSync } from "node:fs"
import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"

const OUT = fileURLToPath(new URL("../aquora-store/apps/storefront/public/images/brand/", import.meta.url))
const args = process.argv.slice(2)
const RUN = args.includes("--run")
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null
const MISSING = args.includes("--missing")

const ACCOUNT = process.env.ASSET_GCLOUD_ACCOUNT || "rami@emergedigital.com"
const PROJECT = process.env.ASSET_PROJECT || "emerge-digital-web-7034"
const MODEL = process.env.ASSET_MODEL || "gemini-3-pro-image-preview"
const ENDPOINT = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${MODEL}:generateContent`
const SPACING = Number(process.env.ASSET_SPACING_MS || 8000)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Drift guard: refuse to run as the wrong account.
const active = execSync("gcloud config get-value account", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
if (RUN && active !== ACCOUNT) {
  console.error(`Active gcloud account is ${active}, expected ${ACCOUNT}. Run: gcloud config set account ${ACCOUNT}`)
  process.exit(1)
}

let _tok = null, _tokAt = 0
function token() {
  if (_tok && Date.now() - _tokAt < 50 * 60e3) return _tok
  _tok = execSync(`gcloud auth print-access-token --account=${ACCOUNT}`).toString().trim()
  _tokAt = Date.now()
  return _tok
}

const STYLE =
  "Premium editorial photograph for a high-end pool, spa & fountain equipment brand in Dubai. " +
  "Cinematic natural light, deep teal and warm gold colour grade, calm water, precision engineering, " +
  "architectural luxury, immaculate and expensive, shallow depth of field, photorealistic, ultra clean composition"
const NEGATIVE =
  "text, words, letters, logos, watermark, signatures, captions, UI, identifiable faces, people looking at camera, " +
  "cartoon, illustration, low quality, blurry, distorted, oversaturated, cluttered, busy background"

// out (relative to public/images/brand/), aspect, width, prompt
const ASSETS = [
  { key: "hero", out: "hero-bg.webp", aspect: "16:9", w: 1920,
    prompt: "A serene luxury infinity pool at a modern Dubai villa at golden hour, glassy turquoise water surface with the faintest ripples catching warm light, sleek stone coping, palm silhouettes far in the soft-focus background, dark teal mood, atmospheric and calm — designed to sit behind a dark overlay as a hero background" },
  { key: "equipment", out: "editorial-equipment.webp", aspect: "3:2", w: 1400,
    prompt: "A spotless modern pool plant room: a row of high-end stainless and white pool pumps, sand filters and a control panel neatly plumbed with PVC pipework, cool teal accent lighting, engineered and precise, shot like a premium product catalogue" },
  { key: "install", out: "editorial-install.webp", aspect: "3:2", w: 1400,
    prompt: "Close-up of skilled hands (no face) in clean work gloves fitting a chrome pool pump fitting with a tool, warm gold rim light, shallow depth of field, conveying expert installation and craftsmanship" },
  { key: "delivery", out: "editorial-delivery.webp", aspect: "3:2", w: 1400,
    prompt: "An organised modern warehouse aisle stocked with boxed pool and spa equipment on clean shelving, teal-tinted overhead light, a sense of fast reliable logistics and availability, wide editorial shot" },
  { key: "support", out: "editorial-support.webp", aspect: "3:2", w: 1400,
    prompt: "Close-up of a technician's hands (no face) checking a digital pool automation control panel with a tablet, soft teal screen glow, premium and trustworthy after-sales service feel" },
  { key: "story", out: "story.webp", aspect: "3:2", w: 1600,
    prompt: "A breathtaking finished luxury swimming pool at a contemporary Dubai villa at dusk, calm illuminated turquoise water, warm gold underwater lighting, elegant water feature, architectural and aspirational, the result of expert engineering" },
  { key: "og", out: "og.webp", aspect: "16:9", w: 1200,
    prompt: "Elegant abstract close-up of a calm turquoise pool water surface with gentle gold-lit ripples, deep teal, minimal and premium, lots of clean negative space at the top for an overlaid logo — a brand social-share background" },
]

async function gen(a) {
  const prompt = `${STYLE}. ${a.prompt}. Avoid: ${NEGATIVE}.`
  const body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: a.aspect } } }
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.status === 429) { const w = 35000 * (attempt + 1); console.log(`   429 — backoff ${w / 1000}s`); await sleep(w); continue }
    if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`)
    const j = await res.json()
    const p = (j.candidates?.[0]?.content?.parts || []).find((x) => x.inlineData)
    if (!p) throw new Error("no image part in response")
    return Buffer.from(p.inlineData.data, "base64")
  }
  throw new Error("429 give-up")
}

const jobs = ASSETS.filter((a) => (!ONLY || a.key.includes(ONLY) || a.out.includes(ONLY)) && (!MISSING || !existsSync(path.join(OUT, a.out))))
console.log(`\nAquora graphics — ${RUN ? "RUN" : "DRY-RUN"}${ONLY ? ` · only "${ONLY}"` : ""} · ${jobs.length} images · model ${MODEL}\n`)
mkdirSync(OUT, { recursive: true })

let ok = 0, fail = 0
for (const a of jobs) {
  if (!RUN) { console.log(`  ${a.out.padEnd(28)} ${a.aspect}`); continue }
  try {
    const png = await gen(a)
    await sharp(png).resize({ width: a.w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(OUT, a.out))
    console.log(`  ✓ ${a.out}`); ok++
    await sleep(SPACING)
  } catch (e) { console.log(`  ✗ ${a.out} — ${e.message}`); fail++ }
}
if (RUN) console.log(`\ndone: ${ok} written, ${fail} failed → public/images/brand/`)
else console.log(`\nDRY-RUN — add --run (try --only hero first).\n`)
