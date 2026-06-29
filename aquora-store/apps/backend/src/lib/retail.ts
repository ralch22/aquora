import { getAccessToken } from "./gcp-token";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const CATALOG = process.env.RETAIL_CATALOG || "default_catalog";
const SERVING = process.env.RETAIL_SERVING_CONFIG || "default_search";

// Bound every Google API call so a stalled retail.googleapis.com connection can't hold a
// Cloud Run request open; on abort the existing try/catch returns the safe fallback.
async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

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

    const r = await timedFetch(`https://retail.googleapis.com/v2/${placement}:search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
      body: JSON.stringify(body),
    }, 6000);
    if (!r.ok) {
      let msg = "";
      try {
        const e: any = await r.json();
        msg = e?.error?.message || "";
      } catch {}
      // Surface token/quota/filter failures instead of silently degrading to Medusa.
      console.warn(`[retail] search non-200 ${r.status}: ${String(msg).slice(0, 160)}`);
      return null;
    }
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
  } catch (e) {
    console.warn(`[retail] search error: ${(e as Error)?.message || e}`);
    return null;
  }
}

// ---- Personalization (Phase 2): user-event ingestion + recommendation Predict ----

const REC_SERVING = process.env.RETAIL_REC_SERVING || ""; // a recommendation serving config id

export type RetailEventType =
  | "home-page-view"
  | "detail-page-view"
  | "add-to-cart"
  | "purchase-complete"
  | "search";

export type RetailEventOpts = {
  visitorId: string;
  productHandles?: string[]; // = Retail product ids
  searchQuery?: string;
};

// Ingest a user event into Retail (feeds the recommendation models + search ranking). Fire-
// and-forget: returns true/false, never throws. Product ids are Medusa handles (= Retail ids).
export async function writeUserEvent(eventType: RetailEventType, opts: RetailEventOpts): Promise<boolean> {
  try {
    const token = await getAccessToken();
    const body: any = { eventType, visitorId: opts.visitorId || "anon" };
    if (opts.productHandles?.length) {
      body.productDetails = opts.productHandles.slice(0, 30).map((h) => ({ product: { id: h } }));
    }
    if (eventType === "search" && opts.searchQuery) body.searchQuery = opts.searchQuery.slice(0, 256);
    const url = `https://retail.googleapis.com/v2/projects/${PROJECT}/locations/global/catalogs/${CATALOG}/userEvents:write`;
    const r = await timedFetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
      body: JSON.stringify(body),
    }, 3000);
    if (!r.ok) {
      let msg = ""; try { msg = (await r.json())?.error?.message || ""; } catch {}
      console.warn(`[retail] userEvent ${eventType} non-200 ${r.status}: ${String(msg).slice(0, 160)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(`[retail] userEvent error: ${(e as Error)?.message || e}`);
    return false;
  }
}

// Retail Recommendations Predict: returns ordered product ids for a recommendation panel, or
// null if no rec serving config is provisioned / the model isn't ready (caller falls back to a
// content heuristic). `contextHandle` seeds item-based panels (e.g. "others you may like").
export async function retailPredict(opts: { visitorId: string; eventType?: "home-page-view" | "detail-page-view"; contextHandle?: string; pageSize?: number }): Promise<string[] | null> {
  if (!REC_SERVING) return null; // not provisioned yet
  try {
    const token = await getAccessToken();
    const userEvent: any = { eventType: opts.eventType || "home-page-view", visitorId: opts.visitorId || "anon" };
    if (opts.contextHandle) userEvent.productDetails = [{ product: { id: opts.contextHandle } }];
    const placement = `projects/${PROJECT}/locations/global/catalogs/${CATALOG}/servingConfigs/${REC_SERVING}`;
    const r = await timedFetch(`https://retail.googleapis.com/v2/${placement}:predict`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
      body: JSON.stringify({ userEvent, pageSize: opts.pageSize ?? 10, params: { returnProduct: false } }),
    }, 5000);
    if (!r.ok) {
      let msg = ""; try { msg = (await r.json())?.error?.message || ""; } catch {}
      console.warn(`[retail] predict non-200 ${r.status}: ${String(msg).slice(0, 160)}`);
      return null;
    }
    const data: any = await r.json();
    return (data.results || []).map((x: any) => x.id).filter(Boolean);
  } catch (e) {
    console.warn(`[retail] predict error: ${(e as Error)?.message || e}`);
    return null;
  }
}
