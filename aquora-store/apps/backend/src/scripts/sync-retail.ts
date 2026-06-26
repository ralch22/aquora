import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils";
import { getAccessToken } from "../lib/gcp-token";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const CATALOG_PATH = `projects/${PROJECT}/locations/global/catalogs/default_catalog`;
const BRANCH_PATH = `${CATALOG_PATH}/branches/0`;
const BASE = "https://retail.googleapis.com/v2";

// Retail import via REST with a Rami-scoped token (drift-proof; x-goog-user-project pins billing to emerge).
async function rfetch(method: string, path: string, body?: any) {
  const token = await getAccessToken();
  const r = await fetch(`${BASE}/${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function pollOp(opName: string) {
  for (let i = 0; i < 90; i++) {
    const { data } = await rfetch("GET", opName);
    if (data?.done) return data;
    await new Promise((res) => setTimeout(res, 2000));
  }
  return { done: false };
}

export default async function syncRetail({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
  const regionId = regions[0]?.id;

  // 1) product level -> primary
  {
    const { ok, data } = await rfetch("PATCH", `${CATALOG_PATH}?updateMask=productLevelConfig`, {
      productLevelConfig: { ingestionProductType: "primary", merchantCenterProductIdField: "offerId" },
    });
    logger.info(`[retail] product level: ${ok ? "ok" : JSON.stringify(data?.error?.message || data).slice(0, 140)}`);
  }

  // 2) serving config for search (idempotent)
  {
    const { ok, data } = await rfetch("POST", `${CATALOG_PATH}/servingConfigs?servingConfigId=default_search`, {
      displayName: "Aquora Search",
      solutionTypes: ["SOLUTION_TYPE_SEARCH"],
    });
    logger.info(`[retail] serving config: ${ok ? "created" : JSON.stringify(data?.error?.message || data).slice(0, 140)}`);
  }

  // 3) import products in batches (inline -> LRO -> poll)
  let offset = 0;
  const take = 100;
  let total = 0;
  while (true) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle", "title", "thumbnail", "images.url", "categories.name", "metadata", "variants.calculated_price.*"],
      filters: { status: "published" } as any,
      pagination: { take, skip: offset },
      ...(regionId ? { context: { variants: { calculated_price: QueryContext({ region_id: regionId, currency_code: "aed" }) } } } : {}),
    } as any);
    if (!data.length) break;

    const products = (data as any[]).map((p) => {
      const img = p.thumbnail || p.images?.[0]?.url;
      const price = Number(p.variants?.[0]?.calculated_price?.calculated_amount || 0);
      return {
        id: p.handle,
        title: (p.title || "Product").slice(0, 1000),
        categories: [p.categories?.[0]?.name || "Pool & Spa Equipment"],
        uri: `https://aquora.ae/products/${p.handle}`,
        availability: "IN_STOCK",
        ...(p.metadata?.brand ? { brands: [String(p.metadata.brand)] } : {}),
        ...(price > 0 ? { priceInfo: { currencyCode: "AED", price } } : {}),
        ...(img ? { images: [{ uri: img }] } : {}),
      };
    });

    const { ok, data: imp } = await rfetch("POST", `${BRANCH_PATH}/products:import`, {
      inputConfig: { productInlineSource: { products } },
      reconciliationMode: "INCREMENTAL",
    });
    if (!ok) { logger.info(`[retail] import error: ${JSON.stringify(imp?.error?.message || imp).slice(0, 180)}`); break; }
    if (imp?.name) await pollOp(imp.name);
    total += products.length;
    offset += take;
    logger.info(`[retail] imported ${total}`);
  }
  logger.info(`[retail] DONE: ${total} products imported to Retail`);
}
