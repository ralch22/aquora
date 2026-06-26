import { getAccessToken } from "./gcp-token";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const CATALOG = process.env.RETAIL_CATALOG || "default_catalog";
const SERVING = process.env.RETAIL_SERVING_CONFIG || "default_search";

// Google Retail Search via REST with a Rami-scoped token (drift-proof; bypasses ADC).
// Returns ordered product ids (= Medusa handles), or null if Retail isn't ready yet
// (caller then falls back to Medusa search).
export async function retailSearch(query: string, visitorId = "anon", pageSize = 24): Promise<string[] | null> {
  try {
    const token = await getAccessToken();
    const placement = `projects/${PROJECT}/locations/global/catalogs/${CATALOG}/servingConfigs/${SERVING}`;
    const r = await fetch(`https://retail.googleapis.com/v2/${placement}:search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
      body: JSON.stringify({ query, visitorId, pageSize }),
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    const ids = (data.results || []).map((x: any) => x.id).filter(Boolean);
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}
