#!/usr/bin/env node
// Kick off Google Vision Product Search: build a reference-image CSV from the GCS
// catalogue, create the product set, and start the import (indexing runs 24-48h).
// Drift-proof: Rami-scoped gcloud token + x-goog-user-project=emerge.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const REPO = "/Users/admin/Documents/aquora";
const PROJECT = "emerge-digital-web-7034";
const LOC = "europe-west1";
const PRODUCT_SET = "aquora-products";
const IMG_BUCKET = "emerge-aquora-products";
const STAGING = "gs://emerge-aquora-staging/vision-import.csv";
const CSV_LOCAL = path.join(REPO, "data", "vision-import.csv");

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
const token = () => execSync(`gcloud auth print-access-token --account=rami@emergedigital.com`, { encoding: "utf8" }).trim();
const csvField = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function vfetch(method, urlPath, body) {
  const r = await fetch(`https://vision.googleapis.com/v1/${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

// 1) Build CSV (no header). cols: image-uri,image-id,product-set-id,product-id,product-category,display-name,labels,bounding-poly
const products = JSON.parse(fs.readFileSync(path.join(REPO, "data", "catalog-raw.json"), "utf8"));
const lines = [];
for (const p of products) {
  if (!p.images || !p.images.length) continue;
  const id = slug(p.handle);
  if (!id) continue;
  const uri = `gs://${IMG_BUCKET}/${id}/0.webp`;
  const labels = p.brand ? `brand=${String(p.brand).replace(/[^A-Za-z0-9 ]/g, "")}` : "";
  lines.push([uri, "", PRODUCT_SET, id, "general-v1", csvField((p.name || "").slice(0, 200)), csvField(labels), ""].join(","));
}
fs.writeFileSync(CSV_LOCAL, lines.join("\n") + "\n");
console.log(`CSV: ${lines.length} reference images -> ${CSV_LOCAL}`);

// 2) Upload CSV to GCS
execSync(`gcloud storage cp ${CSV_LOCAL} ${STAGING} --project ${PROJECT}`, { stdio: "inherit" });
console.log(`uploaded -> ${STAGING}`);

// 3) Create product set (idempotent)
const ps = await vfetch("POST", `projects/${PROJECT}/locations/${LOC}/productSets?productSetId=${PRODUCT_SET}`, { displayName: "Aquora Products" });
console.log("product set:", ps.ok ? "created" : JSON.stringify(ps.data?.error?.message || ps.data).slice(0, 140));

// 4) Import (LRO; indexing then runs automatically, 24-48h)
const imp = await vfetch("POST", `projects/${PROJECT}/locations/${LOC}/productSets:import`, {
  inputConfig: { gcsSource: { csvFileUri: STAGING } },
});
if (!imp.ok) { console.log("IMPORT ERROR:", JSON.stringify(imp.data?.error?.message || imp.data).slice(0, 220)); process.exit(1); }
console.log("IMPORT started. operation:", imp.data?.name || JSON.stringify(imp.data).slice(0, 160));
console.log("Indexing proceeds automatically (~24-48h). Visual search goes live after indexing completes.");
