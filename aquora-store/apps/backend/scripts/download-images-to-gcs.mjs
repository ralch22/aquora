#!/usr/bin/env node
// Download product images from the crawl, normalize to webp, upload to GCS (public).
// Writes data/image-map.json : { "<handle>": ["https://storage.googleapis.com/<bucket>/<handle>/0.webp", ...] }
// Run: node apps/backend/scripts/download-images-to-gcs.mjs [concurrency] [maxPerProduct]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";

const REPO = "/Users/admin/Documents/aquora";
const RAW = path.join(REPO, "data", "catalog-raw.json");
const MAP = path.join(REPO, "data", "image-map.json");
const BUCKET = process.env.GCS_BUCKET || "emerge-aquora-products";
const CONC = parseInt(process.argv[2] || "16", 10);
const MAX_PER = parseInt(process.argv[3] || "3", 10);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const storage = new Storage({ projectId: "emerge-digital-web-7034" });
const bucket = storage.bucket(BUCKET);
const products = JSON.parse(fs.readFileSync(RAW, "utf8"));
const map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, "utf8")) : {};

const publicUrl = (obj) => `https://storage.googleapis.com/${BUCKET}/${obj}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
const absUrl = (u) => (u.startsWith("http") ? u : u.startsWith("//") ? "https:" + u : u.startsWith("/") ? "https://waterstore.ae" + u : "https://" + u);

async function uploadOne(handle, imgUrl, idx) {
  const obj = `${slug(handle)}/${idx}.webp`;
  try {
    const r = await fetch(absUrl(imgUrl), { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const webp = await sharp(buf).resize(900, 900, { fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    await bucket.file(obj).save(webp, { contentType: "image/webp", resumable: false, metadata: { cacheControl: "public, max-age=31536000" } });
    return publicUrl(obj);
  } catch {
    return null;
  }
}

let done = 0, uploaded = 0, cursor = 0;
async function worker() {
  while (cursor < products.length) {
    const p = products[cursor++];
    done++;
    if (map[p.handle]?.length) continue; // idempotent: skip already-done
    const imgs = (p.images || []).slice(0, MAX_PER);
    const urls = [];
    for (let i = 0; i < imgs.length; i++) {
      const u = await uploadOne(p.handle, imgs[i], i);
      if (u) { urls.push(u); uploaded++; }
    }
    if (urls.length) map[p.handle] = urls;
    if (done % 200 === 0) {
      console.log(`  ${done}/${products.length} products, ${uploaded} images uploaded`);
      fs.writeFileSync(MAP, JSON.stringify(map));
    }
  }
}

console.log(`Image pipeline: ${products.length} products @ conc ${CONC} -> gs://${BUCKET}`);
await Promise.all(Array.from({ length: CONC }, worker));
fs.writeFileSync(MAP, JSON.stringify(map));
const withImgs = Object.keys(map).length;
console.log(`DONE: ${uploaded} images uploaded for ${withImgs} products. map -> ${MAP}`);
