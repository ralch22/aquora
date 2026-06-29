<!-- Aquora PR — keep changes small and self-contained (one mergeable concern). -->

## What & why
<!-- 1-3 sentences: the problem this solves and the change. Link the ROADMAP.md PR id if applicable. -->

## Service(s) touched
- [ ] storefront (`aquora-store/apps/storefront`)
- [ ] backend (`aquora-store/apps/backend`)
- [ ] infra / repo only

## Invariants (must hold — see AGENTS.md)
- [ ] **No streamed `<Suspense>` around funnel-critical UI** (add-to-cart, cart count, product grids). In this deployment a deferred Suspense never gets React's completion script and stays hidden forever — resolve inline.
- [ ] **No fabricated data** — no fake reviews/ratings, invented social proof, fake urgency/scarcity, or made-up stock. Real data only.
- [ ] **Comms are Email + WhatsApp only** (no SMS). WhatsApp CTAs stay gated until a real number is configured.
- [ ] **No secrets committed** — `.env*`/`*.dev.vars`/keys stay out of git; owner sets secrets via Secret Manager / gcloud.

## Migrations
- [ ] This PR adds a backend Medusa migration → the **out-of-band migration runner** must run on deploy (see AGENTS.md). Otherwise leave unchecked.

## Verify
<!-- How this was checked. Prefer evidence on https://aquora.ae after deploy. -->
- [ ] `npx tsc --noEmit` passes for the touched app(s)
- [ ] Built locally / CI green
- [ ] Behaviour verified on the live site (describe)
