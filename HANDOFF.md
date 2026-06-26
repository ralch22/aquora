# Aquora — Handoff & Operations Guide

Aquora is a production-grade, AI-powered headless e-commerce platform for **pool, spa, pond & fountain equipment** (Dubai/GCC, AED). It is an original brand whose structure is modelled on waterstore.ae; **all branding and copy are original**, and only **factual** product data (titles, prices, specifications, photos) is sourced from the reference.

- **Repo:** github.com/ralch22/aquora · **Backend:** MedusaJS v2 · **Storefront:** Next.js 15
- **Google Cloud project:** `emerge-digital-web-7034` (Vertex AI + Retail) — Emerge Digital
- **Catalogue:** **5,935 real products** with photos, **5,852 with full spec tables**

---

## 🌐 LIVE (stakeholder review)

| | URL |
|---|---|
| **Storefront** | **https://aquora-storefront-250350263461.europe-west1.run.app/ae** |
| Admin | https://aquora-backend-250350263461.europe-west1.run.app/app · `admin@aquora.ae` / `Aquora!2026` |
| Backend API | https://aquora-backend-250350263461.europe-west1.run.app |

Verified live: catalogue renders · Retail semantic search (`source:retail`) · faceted browse + sort · PDP specs · **Ask Aqua AI assistant returns grounded product cards in-browser**.

**Infra (europe-west1):** Cloud Run `aquora-backend` (2Gi/2cpu, min-1, Cloud SQL socket + SA token for Vertex/Retail) + `aquora-storefront` (1Gi, min-1) → Cloud SQL Postgres 16 `aquora-db` (db-g1-small, ENTERPRISE). Images in Artifact Registry `aquora`. Build: `gcloud builds submit apps/<svc> --tag …/aquora/<svc>:v1 --machine-type=e2-highcpu-8` then `gcloud run deploy`.

**Cost control:** running cost ≈ Cloud SQL (db-g1-small, ~$25–30/mo) + 2 always-warm Cloud Run instances. To pause between reviews: `gcloud run services update aquora-backend --min-instances 0` (and storefront) and `gcloud sql instances patch aquora-db --activation-policy=NEVER` (stop). Teardown: delete the two Cloud Run services + the Cloud SQL instance + the AR repo + `gs://emerge-aquora-deploy`.

> The Cloud Run service-account token (metadata server) powers Vertex/Retail in prod — no gcloud CLI needed there (`gcp-token.ts` switches on `K_SERVICE`).

---

## 1. What's built

| Capability | Where | Notes |
|---|---|---|
| Full catalogue (5,935) + images | GCS `emerge-aquora-products`, Medusa | AED prices, 17 categories, 57 brands |
| **Google Retail semantic search** | `lib/retail.ts`, `/store/search` | `source:"retail"`; Medusa tokenized fallback |
| **Faceted search + category browse** | `/store/search`, `search/page.tsx` | brand/category/price, multi-select, **sort**, pagination, browse mode (empty q + scope) |
| **Multimodal AI assistant ("Ask Aqua")** | `/store/assistant`, `ai-assistant` | Gemini 2.5 Flash (Vertex), RAG-grounded, text + photo |
| **PDP** | `products/templates` | breadcrumb · brand · spec table · trust strip · WhatsApp · quantity stepper · related |
| **Cart / checkout conversion** | `cart`, `checkout` | free-delivery progress, assurance panel, manual payment |
| **SEO** | sitewide + per-page | Product · BreadcrumbList · Organization · WebSite/SearchAction · FAQPage · `additionalProperty` · dynamic sitemap (~5,960 URLs) |
| Blog | `content/blog/*.md` | 12 original Gulf-focused guides, dynamic index |

---

## 2. Run locally

```bash
# 0. Infra (from repo root)
docker compose up -d                 # Postgres 16 (:5432) + Redis 7 (:6379)

# 1. Backend  (apps/backend -> :9000, admin at /app)
cd aquora-store/apps/backend
npm install                          # first time, from aquora-store/
npx medusa db:migrate
npx medusa develop
#   Admin: admin@aquora.ae / Aquora!2026

# 2. Storefront (apps/storefront -> :8000)
cd ../storefront
npm run dev
```

**Env** — `apps/storefront/.env.local` needs the publishable key (regenerated on reseed):
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`, `NEXT_PUBLIC_DEFAULT_REGION=ae`.
`apps/backend/.env`: `GCP_PROJECT=emerge-digital-web-7034` (+ optional `GEMINI_API_KEY`, `STRIPE_API_KEY`).

> ⚠️ If a backend restart "doesn't take", a stale `medusa develop` is squatting on :9000 — `lsof -ti:9000 | xargs kill -9`.

---

## 3. Google Cloud (drift-proof)

This Mac's ADC drifts to another account, so **all GCP calls use an account-scoped token**, never ADC:

```bash
gcloud auth print-access-token --account=rami@emergedigital.com   # see lib/gcp-token.ts (cached 50min)
```

- **Vertex Gemini:** REST `generateContent`, model `gemini-2.5-flash`, location `global`, header `x-goog-user-project`.
- **Retail (AI Commerce Search):** one-time console setup at `console.cloud.google.com/ai/retail/start` — (1) turn on API, (2) **accept data-use terms** (the real gate; takes ~30–60s to propagate), (3) turn on search & browse. Then `medusa exec ./src/scripts/sync-retail.ts`. Inline product import caps at **100/request**.

---

## 4. Data pipeline (reproducing the catalogue)

Run in order. Source pages need a real browser User-Agent (default curl → 0 bytes).

```bash
# A. Crawl catalogue (free; JSON-LD, no Firecrawl needed) -> data/catalog-raw.json (5,935)
node scripts/crawl-direct.mjs

# B. Download + normalise images -> gs://emerge-aquora-products/<slug>/0.webp
cd aquora-store/apps/backend && node scripts/download-images-to-gcs.mjs

# C. Import products (categories, AED prices, original descriptions, GCS images)
medusa exec ./src/scripts/import-catalog.ts        # regenerates publishable key
medusa exec ./src/scripts/extract-brands.ts        # metadata.brand from titles

# D. Specs (factual) -> data/specs.json (5,852) -> metadata.specs
node ../../scripts/scrape-specs.mjs                # ~10-15 min, concurrency 12
medusa exec ./src/scripts/import-specs.ts          # matches exact + normalized handles

# E. Mirror to Google Retail (after console setup in §3)
medusa exec ./src/scripts/sync-retail.ts           # 5,935 -> Retail; search flips to source:retail
```

---

## 5. Owner-gated — needs your input / real data (NOT fabricated)

| Item | Why gated | Action |
|---|---|---|
| **Reviews / ratings** | Fake reviews are deceptive & illegal | Provide real reviews (or connect GBP); then build display + `AggregateRating` |
| **Real payments** | Needs Stripe credentials | Add `STRIPE_API_KEY` + install `@medusajs/payment-stripe` |
| **Newsletter capture** | Needs an email provider | Choose Resend/Mailchimp; wire the footer form |
| **Storefront cache** | `listProducts` uses `cache:"force-cache"` | A production build/deploy refreshes all PDPs; for live data changes add `revalidateTag` |
| **Contact details** | Placeholders in `lib/aquora/brand.ts` | Replace `hello@aquora.ae`, phone, WhatsApp number |

---

## 6. Key scripts

`scripts/`: `crawl-direct.mjs` (catalogue), `scrape-specs.mjs` (specs), `download-images-to-gcs.mjs` (images).
`apps/backend/src/scripts/`: `import-catalog.ts`, `extract-brands.ts`, `import-specs.ts`, `sync-retail.ts`.

See [README.md](README.md) for the original architecture overview and `~/.claude/.../memory/aquora-pool-store.md` for the full build log and gotchas.
