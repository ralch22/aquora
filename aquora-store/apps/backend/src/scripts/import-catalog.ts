import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow, createInventoryLevelsWorkflow, createProductCategoriesWorkflow,
  createProductsWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow,
  createShippingOptionsWorkflow, createStockLocationsWorkflow, createStoresWorkflow,
  createTaxRegionsWorkflow, linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow, updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";

type Raw = {
  url: string; handle: string; name: string; sku?: string | null; mpn?: string | null;
  brand?: string | null; description?: string; images: string[]; price?: number;
  currency?: string; availability?: string | null; categoryPath: string[];
};

const REPO = "/Users/admin/Documents/aquora";
const GCS_BASE = "https://storage.googleapis.com/emerge-aquora-products";
const GCC = ["ae", "sa", "qa", "kw", "bh", "om"];

// Deterministic pseudo-random in [0,1) from a string (stable prices across re-runs)
function hrand(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}

// Generate a believable AED price from category + name keywords (source has none)
function priceAED(p: Raw): number {
  const t = `${p.categoryPath.join(" ")} ${p.name}`.toLowerCase();
  const bands: [RegExp, number, number][] = [
    [/spa|sauna|steam|hot tub|jacuzzi/, 9000, 55000],
    [/heat pump|heater|heat exchanger/, 3000, 18000],
    [/robot|robotic|cleaner|cleaning/, 1500, 9000],
    [/\bpump\b|circulation|booster/, 600, 9000],
    [/filter|filtration|sand|cartridge|media/, 700, 5500],
    [/chlorinat|salt|uv|ozone|dosing|control panel|automation/, 800, 7000],
    [/light|led|lighting|projector/, 200, 1600],
    [/valve|multiport/, 150, 1400],
    [/pipe|fitting|union|elbow|coupling|flange|cement/, 25, 450],
    [/ladder|handrail|grab rail|step/, 350, 3500],
    [/cover|roller|reel/, 600, 9000],
    [/nozzle|fountain|jet/, 150, 4000],
    [/chemical|ph |chlorine|test kit|clarifier|algaecide/, 40, 500],
    [/skimmer|drain|grate|inlet|return/, 60, 900],
  ];
  let lo = 100, hi = 3000;
  for (const [re, l, h] of bands) { if (re.test(t)) { lo = l; hi = h; break; } }
  const v = lo + hrand(p.handle) * (hi - lo);
  // round to a clean number
  return Math.max(10, Math.round(v / 5) * 5);
}

function cleanName(n: string): string {
  return n.replace(/\s+/g, " ").trim().slice(0, 220);
}

// Normalize a handle so it is valid as a Medusa handle, a GCS path, and a Vision product-id
function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
}

// Keyword classifier -> sensible category (source breadcrumbs were absent). Order: specific -> general.
const CATEGORIES: { name: string; handle: string; re: RegExp }[] = [
  { name: "Pool Heating", handle: "pool-heating", re: /heat pump|heater|heat exchanger|solar (panel|heat)/i },
  { name: "Pool Pumps", handle: "pool-pumps", re: /\bpump\b|circulation|booster/i },
  { name: "Valves & Multiport", handle: "valves-multiport", re: /multiport|\bvalve\b|actuator/i },
  { name: "Pool Filtration", handle: "pool-filtration", re: /filter|filtration|\bsand\b|cartridge|filter media|d\.?e\.? filter/i },
  { name: "Pool Cleaning", handle: "pool-cleaning", re: /cleaner|robotic|vacuum|brush|leaf|telepole|skim net|cleaning/i },
  { name: "Water Treatment", handle: "water-treatment", re: /chlorinat|\bsalt\b|\buv\b|ozone|dosing|chemical|clarifier|algaecide|test kit|ph\b|sanitis|electrolys/i },
  { name: "Pool Lighting", handle: "pool-lighting", re: /\blight\b|led|lamp|projector|luminaire/i },
  { name: "Spa & Wellness", handle: "spa-wellness", re: /\bspa\b|sauna|steam|hot tub|jacuzzi|hydromassage|whirlpool|massage jet/i },
  { name: "Fountains", handle: "fountains", re: /fountain|nozzle/i },
  { name: "Ponds & Water Features", handle: "ponds", re: /\bpond\b|waterfall|cascade/i },
  { name: "Pipes & Fittings", handle: "pipes-fittings", re: /\bpipe\b|fitting|union|elbow|coupling|flange|cement|\btee\b|\bbend\b|adapter|adaptor|nipple|bush/i },
  { name: "Covers & Reels", handle: "covers-reels", re: /\bcover\b|roller|\breel\b/i },
  { name: "Dehumidifiers", handle: "dehumidifiers", re: /dehumidif/i },
  { name: "Ladders & Rails", handle: "ladders-rails", re: /ladder|handrail|grab rail|\bstep\b|deck anchor/i },
  { name: "Drains, Skimmers & Inlets", handle: "drains-skimmers", re: /\bdrain\b|grate|skimmer|inlet|return jet|main drain/i },
  { name: "Liners & Waterproofing", handle: "liners-waterproofing", re: /liner|membrane|waterproof|tile|coping|mosaic/i },
];
function classify(name: string): { name: string; handle: string } {
  for (const c of CATEGORIES) if (c.re.test(name)) return { name: c.name, handle: c.handle };
  return { name: "Pool & Spa Accessories", handle: "accessories" };
}

// Original, factual description (NOT the scraped marketing copy)
function describe(p: Raw): string {
  const leaf = classify(p.name).name;
  const bits = [
    `${cleanName(p.name)}${p.brand ? ` — ${p.brand}` : ""}.`,
    leaf ? `Part of Aquora's ${leaf} range for pools, spas and water features across the UAE and the GCC.` : "Supplied across the UAE and the GCC by Aquora.",
    p.sku ? `Reference: ${p.sku}.` : "",
    `Genuine equipment with delivery, installation and after-sales support. Contact our team for specification and bulk pricing.`,
  ].filter(Boolean);
  return bits.join(" ");
}

export default async function importCatalog({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillment = container.resolve(Modules.FULFILLMENT);

  const raw: Raw[] = JSON.parse(fs.readFileSync(path.join(REPO, "data", "catalog-raw.json"), "utf8"));
  // dedupe by handle
  const seen = new Set<string>();
  const products = raw.filter((p) => p.name && p.handle && !seen.has(p.handle) && seen.add(p.handle));
  logger.info(`[import] ${products.length} unique products`);

  // ---- store, sales channel, publishable key, region, shipping (mirror aquora-seed) ----
  const { result: [salesChannel] } = await createSalesChannelsWorkflow(container).run({
    input: { salesChannelsData: [{ name: "Aquora Online Store", description: "Aquora storefront" }] },
  });
  const { result: [pubKey] } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "Aquora Storefront", type: "publishable", created_by: "" }] },
  });
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: pubKey.id, add: [salesChannel.id] } });

  const supported_currencies = [{ currency_code: "aed", is_default: true }, { currency_code: "usd", is_default: false }];
  const { data: stores } = await query.graph({ entity: "store", fields: ["id"] });
  if (stores.length) {
    await updateStoresWorkflow(container).run({ input: { selector: { id: stores[0].id }, update: { name: "Aquora", supported_currencies, default_sales_channel_id: salesChannel.id } } });
  } else {
    await createStoresWorkflow(container).run({ input: { stores: [{ name: "Aquora", supported_currencies, default_sales_channel_id: salesChannel.id }] } });
  }

  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: { regions: [{ name: "United Arab Emirates", currency_code: "aed", countries: GCC, payment_providers: ["pp_system_default"] }] },
  });
  const region = regionResult[0];
  await createTaxRegionsWorkflow(container).run({ input: GCC.map((c) => ({ country_code: c, provider_id: "tp_system" })) });

  const { result: [stockLocation] } = await createStockLocationsWorkflow(container).run({
    input: { locations: [{ name: "Dubai Distribution Centre", address: { city: "Dubai", country_code: "AE", address_1: "Dubai Investment Park" } }] },
  });
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } });
  const { data: [shippingProfile] } = await query.graph({ entity: "shipping_profile", fields: ["id"] });
  const fset = await fulfillment.createFulfillmentSets({
    name: "Aquora GCC delivery", type: "shipping",
    service_zones: [{ name: "GCC", geo_zones: GCC.map((c) => ({ country_code: c, type: "country" as const })) }],
  });
  await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id }, [Modules.FULFILLMENT]: { fulfillment_set_id: fset.id } });
  await createShippingOptionsWorkflow(container).run({
    input: [{
      name: "Standard Delivery", price_type: "flat", provider_id: "manual_manual",
      service_zone_id: fset.service_zones[0].id, shipping_profile_id: shippingProfile.id,
      type: { label: "Standard", description: "2-4 working days across the UAE.", code: "standard" },
      prices: [{ currency_code: "aed", amount: 30 }, { region_id: region.id, amount: 30 }],
      rules: [{ attribute: "enabled_in_store", value: "true", operator: "eq" }, { attribute: "is_return", value: "false", operator: "eq" }],
    }],
  });
  await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: stockLocation.id, add: [salesChannel.id] } });

  // ---- flat categories from the keyword classifier (breadcrumbs were absent) ----
  logger.info("[import] creating categories...");
  const usedCats = new Map<string, string>(); // handle -> name
  for (const p of products) { const c = classify(p.name); usedCats.set(c.handle, c.name); }
  const { result: catRows } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: [...usedCats].map(([handle, name], i) => ({ name, handle, is_active: true, rank: i })) },
  });
  const catId = new Map<string, string>(); // handle -> id
  catRows.forEach((c) => catId.set((c as any).handle, c.id));
  logger.info(`[import]   ${catRows.length} categories`);

  // ---- products in batches ----
  logger.info("[import] importing products...");
  const skuSeen = new Set<string>();
  let count = 0;
  const BATCH = 200;
  for (let i = 0; i < products.length; i += BATCH) {
    const chunk = products.slice(i, i + BATCH).map((p) => {
      const cid = catId.get(classify(p.name).handle);
      const h = slug(p.handle);
      const nImgs = Math.min((p.images || []).length, 3);
      const images = Array.from({ length: nImgs }, (_, k) => ({ url: `${GCS_BASE}/${h}/${k}.webp` }));
      let sku = (p.sku || p.mpn || p.handle).toString().toUpperCase().replace(/[^A-Z0-9._-]/g, "-").slice(0, 60);
      while (skuSeen.has(sku)) sku = sku + "-" + Math.floor(hrand(sku + count) * 1000);
      skuSeen.add(sku);
      return {
        title: cleanName(p.name), handle: h, description: describe(p),
        status: ProductStatus.PUBLISHED, category_ids: cid ? [cid] : [],
        shipping_profile_id: shippingProfile.id,
        ...(p.brand ? { metadata: { brand: p.brand } } : {}),
        images,
        options: [{ title: "Type", values: ["Standard"] }],
        variants: [{ title: "Standard", sku, manage_inventory: true, options: { Type: "Standard" }, prices: [{ amount: priceAED(p), currency_code: "aed" }] }],
        sales_channels: [{ id: salesChannel.id }],
      };
    });
    await createProductsWorkflow(container).run({ input: { products: chunk } });
    count += chunk.length;
    if (i % 1000 === 0 || i + BATCH >= products.length) logger.info(`[import]   ${count}/${products.length} products`);
  }

  // ---- inventory ----
  logger.info("[import] inventory levels...");
  const { data: invItems } = await query.graph({ entity: "inventory_item", fields: ["id"], pagination: { take: 20000 } });
  for (let i = 0; i < invItems.length; i += 1000) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: invItems.slice(i, i + 1000).map((it) => ({ location_id: stockLocation.id, stocked_quantity: 100, inventory_item_id: it.id })) },
    });
  }

  logger.info(`[import] DONE: ${catId.size} categories, ${count} products.`);
  logger.info(`[import] PUBLISHABLE_KEY=${(pubKey as any).token}`);
}
