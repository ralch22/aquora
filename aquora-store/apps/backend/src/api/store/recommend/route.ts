import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { retailPredict, retailSearch } from "../../../lib/retail";
import { hydrateProducts } from "../../../lib/product-lookup";
import { COMPLEMENTARY } from "../../../lib/complementary";

function sanitizeFacet(s: string): string {
  return String(s || "").replace(/[^\p{L}\p{N}\s\-_.&/]/gu, "").trim();
}

// Phase 2: recommendation panel. Tries Google Retail Recommendations (Predict) for true
// personalisation when a rec serving config is provisioned (RETAIL_REC_SERVING); otherwise
// falls back to an honest content heuristic — complementary categories for a product context
// (PDP "you may also need"), or a popular-category mix for the homepage. Returns rich cards.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const visitorId = String(req.query.v || "anon").slice(0, 64);
  const handle = req.query.handle ? String(req.query.handle) : undefined;
  const limit = Math.max(2, Math.min(12, parseInt(String(req.query.limit || "8"), 10) || 8));

  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}

  // 1. Retail Recommendations (personalised) — null until a model is provisioned + trained.
  let ids = await retailPredict({
    visitorId,
    eventType: handle ? "detail-page-view" : "home-page-view",
    contextHandle: handle,
    pageSize: limit + 2,
  });
  let source = "retail-predict";

  // 2. Content fallback.
  if (!ids || !ids.length) {
    source = "content";
    ids = await contentFallback(graph, handle, limit + 2);
  }

  const finalIds = (ids || []).filter((h) => h !== handle).slice(0, limit);
  const products = await hydrateProducts(graph, finalIds, regionId);
  res.json({ products, source });
}

// Complementary categories for a product (PDP), or a flagship-category mix for the homepage.
async function contentFallback(graph: any, handle: string | undefined, limit: number): Promise<string[]> {
  try {
    let names: string[] = [];
    if (handle) {
      const { data: prod } = await graph.graph({ entity: "product", fields: ["categories.handle"], filters: { handle } as any, pagination: { take: 1 } });
      const catHandles: string[] = (prod[0]?.categories || []).map((c: any) => c.handle).filter(Boolean);
      const related = [...new Set(catHandles.flatMap((ch) => COMPLEMENTARY[ch] || []))];
      if (related.length) {
        const { data: cats } = await graph.graph({ entity: "product_category", fields: ["name"], filters: { handle: related } as any, pagination: { take: related.length } });
        names = (cats as any[]).map((c) => c.name).filter(Boolean);
      }
    }
    if (!names.length) {
      // Homepage / no related categories -> a popular flagship mix.
      names = ["Pool Pumps", "Pool Filtration Systems", "Pool Cleaners", "Pool Heaters"];
    }
    const filter = `categories: ANY(${names.map((n) => `"${sanitizeFacet(n)}"`).join(",")})`;
    const r = await retailSearch("", { pageSize: limit, filter });
    return r?.ids || [];
  } catch {
    return [];
  }
}
