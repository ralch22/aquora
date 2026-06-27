# Aquora pricing intelligence

## Why this isn't full auto-pricing
We validated (Firecrawl, June 2026) that **competitor-based auto-pricing of the catalogue is not reliable**:
- UAE competitors (waterstore, aquatechpools, astralux, aqua-me) **hide prices** ("request a quote").
- Amazon.ae is **bot-blocked** even with stealth proxy.
- International retailers publish prices but carry **different models / imperial sizing / part-listings**, and don't stock most of our EU/metric SKUs — so matching our *specific* professional products is unreliable (sample produced wrong prices).

**Validated price sources that DO work:**
- **Noon.com** via Firecrawl `proxy: "stealth"` → AED (consumer brands + many spare parts).
- **EU retailer poolsana.de** → EUR (AstralPool / Speck / Espa / metric units).
- **US retailer inyopools.com** → USD (Hayward / Pentair), but listing pages mix in spare-part prices.

## The tool: on-demand market-price lookup
`scripts/price-lookup.mjs` — query the validated sources for a product, get real public prices
converted to AED with a suggested retail at +15%. **Never changes catalogue prices** — it's for
pricing decisions and supplier-negotiation leverage.

```bash
node scripts/price-lookup.mjs "AstralPool Aster 600 sand filter"
node scripts/price-lookup.mjs --handle <aquora-product-handle>
```
Output per candidate: source, confidence, original price+currency, AED-equivalent, suggested
retail (×1.15), and a link. Brand routes the sources (Hayward/Pentair→US, AstralPool/Speck/Espa→EU,
everything→Noon).

Tunables (env): `FX_USD` (3.6725), `FX_EUR` (3.95), `IMPORT_FACTOR` (1.4, landed adj for non-AED),
`MARKUP` (0.15).

## Related
`scripts/pricing-research.mjs` — the batch/approval-gated experiment (brand-routed, sanity-bounded,
writes `data/price-proposals.json`, never applies). Kept for reference; the on-demand tool above is
the recommended workflow given the coverage limits.
