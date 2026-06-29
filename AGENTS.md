# Aquora — Agent Runbook

This repo is built and operated largely by autonomous agents (locally and via AO / ao-agents.com).
Read this before changing code. It encodes the non-obvious invariants and the deploy/verify loop.

## Layout
- Monorepo root: this directory. Application source lives under **`aquora-store/`**.
  - `aquora-store/apps/storefront` — Next.js 15 (App Router) storefront.
  - `aquora-store/apps/backend` — MedusaJS v2 backend.
- Live: storefront + backend on **Google Cloud Run** (project `emerge-digital-web-7034`, region `europe-west1`),
  fronted by a Cloudflare Worker: `aquora.ae` → storefront, `api.aquora.ae` → backend. DB: Cloud SQL Postgres `aquora-db`.

## Hard invariants (do not violate)
1. **No streamed `<Suspense>` around funnel-critical UI.** In this deployment a deferred/post-shell Suspense
   boundary never receives React's `$RC` completion script, so its content stays hidden forever. Add-to-cart,
   cart count, product grids, etc. **must render inline** (resolve before the shell flush). Never reintroduce a
   streamed Suspense around them.
2. **No fabricated data, ever.** No fake reviews/ratings, invented social proof ("X people bought this"), fake
   urgency/countdowns/scarcity, or made-up stock numbers. Only real data (real inventory, real Stripe methods,
   real delivery policy). Trust CTAs (WhatsApp/phone) stay gated behind `hasReal*` flags until a real value exists.
3. **Comms = Email + WhatsApp only.** No SMS. The WhatsApp number is a placeholder until the owner sets a real one.
4. **Secrets never touch git.** `.env*`, `*.dev.vars`, keys, service-account JSON are git-ignored. The owner sets
   secrets via Secret Manager / `gcloud`. The client may only ever see the publishable `pk_` key. Never print the
   contents of a secret file, and never run `gcloud run services describe --format=json` for env (it embeds the
   Cloud SQL password in plaintext).

## Build / typecheck (what CI gates)
Each app builds independently from its own `package.json` (the Docker build context is the app dir):
```bash
cd aquora-store/apps/storefront && npm install --legacy-peer-deps && npx tsc --noEmit -p tsconfig.json && npm run build
cd aquora-store/apps/backend    && npm install --legacy-peer-deps && npm run build
```
- Storefront `next build` needs `NEXT_PUBLIC_MEDUSA_BACKEND_URL` and `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` (placeholders are fine for a build).
- Backend admin TSX may produce root-`tsc` noise; the gate is `npm run build` (Medusa uses its own tsconfig). Do not add a raw root `tsc` over `apps/backend`.

## Deploy (image-only preserves env vars + command overrides)
```bash
# build
gcloud builds submit aquora-store/apps/<svc> \
  --tag europe-west1-docker.pkg.dev/emerge-digital-web-7034/aquora/<svc>:vN \
  --machine-type=e2-highcpu-8 --timeout=1800
# deploy
gcloud run deploy aquora-<svc> --image europe-west1-docker.pkg.dev/emerge-digital-web-7034/aquora/<svc>:vN \
  --region europe-west1 --quiet
```
`<svc>` ∈ {storefront, backend}. Once the auto-deploy pipeline (ROADMAP WS0-PR4) lands, a merged PR does this for you.

## Backend migrations (out-of-band)
Boot-time migration is unreliable here (startup-probe timeout + CPU starvation; the Medusa `db:migrate` CLI hangs).
Run module migrations as a **short-lived Cloud Run Job** from the backend image with the Cloud SQL instance attached
(`--set-cloudsql-instances=emerge-digital-web-7034:europe-west1:aquora-db`), executing the generated `CREATE TABLE IF
NOT EXISTS` SQL via a tiny `pg` script. The runner is
[`aquora-store/apps/backend/src/scripts/run-migrations.js`](aquora-store/apps/backend/src/scripts/run-migrations.js):
it discovers every `src/modules/*/migrations/Migration*` file, applies each up()'s SQL idempotently inside a
transaction, records it in an `aquora_oob_migrations` tracking table (so re-runs are no-ops), and exits non-zero on
failure. It needs only `DATABASE_URL` (no Medusa bootstrap, so it never hangs). Run it locally with
`npm run migrate:oob`. On deploy, `.github/workflows/deploy.yml` runs it as the `aquora-migrate` Cloud Run Job
(`node /app/src/scripts/run-migrations.js`, `DATABASE_URL` from Secret Manager) **before** the new backend revision
serves traffic — but only when the merged push changed files under `*/migrations/`. If a PR adds a migration, check
that box in the PR template.

## Verify
Verify behaviour on **https://aquora.ae** after deploy — never assume. Trust screenshots over `getComputedStyle`
for border/transition values. Note: a local Next dev server can't reach the prod backend, so it renders blank below
the nav — verify on the live site, not a local preview.

## Roadmap
`ROADMAP.md` is the AO-executable backlog (46 PRs, 6 milestones). Pick a PR whose `dependsOn` are merged.
