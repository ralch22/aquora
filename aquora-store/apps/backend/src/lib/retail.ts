import { SearchServiceClient } from "@google-cloud/retail";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const CATALOG = process.env.RETAIL_CATALOG || "default_catalog";
const SERVING = process.env.RETAIL_SERVING_CONFIG || "default_search";

let _client: SearchServiceClient | null = null;

// Returns ordered Retail product ids (= Medusa product handles) for a text query,
// or null if Retail isn't configured/available yet (caller then falls back to Medusa search).
export async function retailSearch(query: string, visitorId = "anon", pageSize = 24): Promise<string[] | null> {
  try {
    _client = _client || new SearchServiceClient();
    const placement = `projects/${PROJECT}/locations/global/catalogs/${CATALOG}/servingConfigs/${SERVING}`;
    const [results] = await _client.search({ placement, query, visitorId, pageSize } as any, { autoPaginate: false });
    const ids = (results || []).map((r: any) => r.id || r.product?.id).filter(Boolean);
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}
