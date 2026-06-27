#!/usr/bin/env node
// Download product images from the crawl, normalize to webp, upload to GCS (public).
// Writes data/image-map.json : { "<handle>": ["https://storage.googleapis.com/<bucket>/<handle>/0.webp", ...] }
// Run: node apps/backend/scripts/download-images-to-gcs.mjs [concurrency] [maxPerProduct]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";
import { OAuth2Client } from "google-auth-library";

const REPO = "/Users/admin/Documents/aquora";
const RAW = path.join(REPO, "data", "catalog-raw.json");
const MAP = path.join(REPO, "data", "image-map.json");
const BUCKET = process.env.GCS_BUCKET || "emerge-aquora-products";
const CONC = parseInt(process.argv[2] || "16", 10);
const MAX_PER = parseInt(process.argv[3] || "3", 10);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// ADC on this Mac drifts to the SES account (no write perms on the emerge bucket),
// so prefer an explicit rami access token (GCS_TOKEN) when provided.
function makeStorage() {
  // Prefer a token from GCS_TOKEN_FILE (avoids subshell mint races), then GCS_TOKEN env.
  const token = process.env.GCS_TOKEN_FILE
    ? fs.readFileSync(process.env.GCS_TOKEN_FILE, "utf8").trim()
    : (process.env.GCS_TOKEN || "").trim();
  if (token) {
    const oauth = new OAuth2Client();
    oauth.setCredentials({ access_token: token });
    return new Storage({ projectId: "emerge-digital-web-7034", authClient: oauth });
  }
  return new Storage({ projectId: "emerge-digital-web-7034" });
}
const storage = makeStorage();
const bucket = storage.bucket(BUCKET);
const products = JSON.parse(fs.readFileSync(RAW, "utf8"));
const map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, "utf8")) : {};
// Optional override: a {handle:[source urls]} map (e.g. data/images.json from the
// gallery scrape) to upload MULTIPLE images per product instead of catalog-raw's single.
const IMAGES = process.env.IMAGES_JSON ? JSON.parse(fs.readFileSync(process.env.IMAGES_JSON, "utf8")) : null;

const publicUrl = (obj) => `https://storage.googleapis.com/${BUCKET}/${obj}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
const absUrl = (u) => (u.startsWith("http") ? u : u.startsWith("//") ? "https:" + u : u.startsWith("/") ? "https://waterstore.ae" + u : "https://" + u);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function uploadOne(handle, imgUrl, idx) {
  const obj = `${slug(handle)}/${idx}.webp`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000); // fail fast; a later pass back-fills
      const r = await fetch(absUrl(imgUrl), { headers: { "User-Agent": UA }, signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) { if (attempt < 1) { await sleep(300); continue; } return null; }
      const buf = Buffer.from(await r.arrayBuffer());
      const webp = await sharp(buf).resize(900, 900, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      await bucket.file(obj).save(webp, { contentType: "image/webp", resumable: false, metadata: { cacheControl: "public, max-age=31536000" } });
      return publicUrl(obj);
    } catch {
      if (attempt < 2) { await sleep(500 * (attempt + 1)); continue; }
      return null;
    }
  }
  return null;
}

let done = 0, uploaded = 0, cursor = 0;
async function worker() {
  while (cursor < products.length) {
    const p = products[cursor++];
    done++;
    const imgs = (((IMAGES && IMAGES[p.handle]) || p.images || [])).slice(0, MAX_PER);
    const existing = map[p.handle] || []; // already-uploaded GCS urls, contiguous from index 0
    if (existing.length >= imgs.length) continue; // fully done -> skip (don't re-fetch index 0)
    const urls = existing.slice();
    for (let i = existing.length; i < imgs.length; i++) {
      const u = await uploadOne(p.handle, imgs[i], i);
      if (u) { urls.push(u); uploaded++; } else break; // stop at first gap; next pass resumes here
    }
    if (urls.length) map[p.handle] = urls;
    if (done % 100 === 0) {
      const multi = Object.values(map).filter((a) => a.length > 1).length;
      console.log(`  ${done}/${products.length} done, ${uploaded} uploaded, ${multi} multi-image`);
      fs.writeFileSync(MAP, JSON.stringify(map));
    }
  }
}

console.log(`Image pipeline: ${products.length} products @ conc ${CONC} -> gs://${BUCKET}`);
await Promise.all(Array.from({ length: CONC }, worker));
fs.writeFileSync(MAP, JSON.stringify(map));
const withImgs = Object.keys(map).length;
console.log(`DONE: ${uploaded} images uploaded for ${withImgs} products. map -> ${MAP}`);
