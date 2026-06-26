import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils";
import { CatalogServiceClient, ProductServiceClient } from "@google-cloud/retail";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const CATALOG = `projects/${PROJECT}/locations/global/catalogs/default_catalog`;
const BRANCH = `${CATALOG}/branches/0`;

export default async function syncRetail({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
  const regionId = regions[0]?.id;

  const catalogClient = new CatalogServiceClient();
  // 1) Product level -> primary
  try {
    await catalogClient.updateCatalog({
      catalog: { name: CATALOG, productLevelConfig: { ingestionProductType: "primary", merchantCenterProductIdField: "offerId" } },
      updateMask: { paths: ["product_level_config"] },
    } as any);
    logger.info("[retail] product level set to primary");
  } catch (e: any) { logger.info("[retail] product level: " + String(e?.message || e).slice(0, 100)); }

  // NOTE: the "default_search" serving config is created automatically when you
  // accept the Retail data-use terms + enable Search in the Retail console.
  // retail.ts queries projects/.../servingConfigs/default_search.

  // 2) Import products in batches
  const productClient = new ProductServiceClient();
  let offset = 0;
  const take = 500;
  let total = 0;
  while (true) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle", "title", "thumbnail", "images.url", "categories.name", "variants.calculated_price.*"],
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
        ...(price > 0 ? { priceInfo: { currencyCode: "AED", price } } : {}),
        ...(img ? { images: [{ uri: img }] } : {}),
      };
    });

    const [op] = await productClient.importProducts({
      parent: BRANCH,
      inputConfig: { productInlineSource: { products } },
      reconciliationMode: "INCREMENTAL",
    } as any);
    await op.promise();
    total += products.length;
    offset += take;
    logger.info(`[retail] imported ${total}`);
  }
  logger.info(`[retail] DONE: ${total} products imported to Retail catalog`);
}
