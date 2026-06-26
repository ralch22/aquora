import { getAccessToken } from "./gcp-token";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const CATALOG = process.env.RETAIL_CATALOG || "default_catalog";
const SERVING = process.env.RETAIL_SERVING_CONFIG || "default_search";

// Canonical AED price bands — kept in lockstep between the facet request (intervals)
// and the filter parser (route.ts) so the facet a shopper clicks maps to a real filter.
export const PRICE_BANDS = [
  { key: "0-100", label: "Under AED 100", min: 0, max: 100 },
  { key: "100-300", label: "AED 100 – 300", min: 100, max: 300 },
  { key: "300-700", label: "AED 300 – 700", min: 300, max: 700 },
  { key: "700-1500", label: "AED 700 – 1,500", min: 700, max: 1500 },
  { key: "1500-3000", label: "AED 1,500 – 3,000", min: 1500, max: 3000 },
  { key: "3000-", label: "AED 3,000+", min: 3000, max: undefined as number | undefined },
];

const PRICE_INTERVALS = PRICE_BANDS.map((b) =>
  b.max === undefined ? { minimum: b.min } : { minimum: b.min, exclusiveMaximum: b.max }
);

export type RetailFacetValue = { value: string; count: number };
export type RetailFacet = { key: string; values: RetailFacetValue[] };
export type RetailResult = { ids: string[]; total: number; facets: RetailFacet[] };

export type RetailSearchOpts = {
  visitorId?: string;
  pageSize?: number;
  offset?: number;
  filter?: string;
};

// Google Retail Search via REST with a Rami-scoped token (drift-proof; bypasses ADC).
// Returns ordered product ids (= Medusa handles) + facet counts + total, or null if
// Retail isn't ready (caller then falls back to Medusa search).
export async function retailSearch(query: string, opts: RetailSearchOpts = {}): Promise<RetailResult | null> {
  try {
    const token = await getAccessToken();
    const placement = `projects/${PROJECT}/locations/global/catalogs/${CATALOG}/servingConfigs/${SERVING}`;
    const body: any = {
      query,
      visitorId: opts.visitorId || "anon",
      pageSize: opts.pageSize ?? 24,
      offset: opts.offset ?? 0,
      // excludedFilterKeys makes each facet independent: selecting one brand still
      // shows counts for every other brand (true multi-select faceting), rather than
      // collapsing the list to the single chosen value.
      facetSpecs: [
        { facetKey: { key: "brands" }, excludedFilterKeys: ["brands"] },
        { facetKey: { key: "categories" }, excludedFilterKeys: ["categories"] },
        { facetKey: { key: "price", intervals: PRICE_INTERVALS }, excludedFilterKeys: ["price"] },
      ],
    };
    if (opts.filter) body.filter = opts.filter;

    const r = await fetch(`https://retail.googleapis.com/v2/${placement}:search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    const data: any = await r.json();

    const ids = (data.results || []).map((x: any) => x.id).filter(Boolean);
    const facets: RetailFacet[] = (data.facets || []).map((f: any) => ({
      key: f.key,
      values: (f.values || [])
        .map((v: any) => ({
          value:
            v.value != null
              ? String(v.value)
              : v.interval
              ? `${v.interval.minimum || 0}-${v.interval.exclusiveMaximum ?? ""}`
              : "",
          count: Number(v.count || 0),
        }))
        .filter((x: RetailFacetValue) => x.value && x.count > 0),
    }));

    return { ids, total: Number(data.totalSize || ids.length), facets };
  } catch {
    return null;
  }
}
