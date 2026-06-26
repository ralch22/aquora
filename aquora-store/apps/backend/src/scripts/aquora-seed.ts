import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import fs from "fs";
import path from "path";

type Spec = { label: string; value: string };
type Variant = { title: string; sku: string; price_aed: number };
type Product = {
  handle: string;
  title: string;
  subtitle?: string;
  description: string;
  house_line?: string;
  material?: string;
  specs: Spec[];
  option_title: string;
  variants: Variant[];
  image_hint?: string;
};
type Cat = {
  category: { handle: string; name: string; description: string };
  products: Product[];
};

function buildDescription(p: Product): string {
  const specLines = (p.specs || [])
    .map((s) => `- **${s.label}:** ${s.value}`)
    .join("\n");
  const parts = [p.description.trim()];
  if (p.house_line) parts.push(`**Aquora ${p.house_line} line.**`);
  if (specLines) parts.push(`**Specifications**\n${specLines}`);
  return parts.join("\n\n");
}

export default async function aquoraSeed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  const catalogPath = path.join(process.cwd(), "src/data/aquora-catalog.json");
  const catalog: Cat[] = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));

  // Aquora ships across the GCC; UAE is the home region.
  const gccCountries = ["ae", "sa", "qa", "kw", "bh", "om"];

  logger.info("[Aquora] Seeding store + sales channel...");
  const {
    result: [salesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        { name: "Aquora Online Store", description: "Aquora storefront" },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        { title: "Aquora Storefront", type: "publishable", created_by: "" },
      ],
    },
  });
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: publishableApiKey.id, add: [salesChannel.id] },
  });

  // A default store already exists after migrations -> update it; otherwise create.
  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id"],
  });
  const supported_currencies = [
    { currency_code: "aed", is_default: true },
    { currency_code: "usd", is_default: false },
  ];
  if (existingStores.length) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: existingStores[0].id },
        update: {
          name: "Aquora",
          supported_currencies,
          default_sales_channel_id: salesChannel.id,
        },
      },
    });
  } else {
    await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "Aquora",
            supported_currencies,
            default_sales_channel_id: salesChannel.id,
          },
        ],
      },
    });
  }

  logger.info("[Aquora] Seeding UAE region...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United Arab Emirates",
          currency_code: "aed",
          countries: gccCountries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];

  await createTaxRegionsWorkflow(container).run({
    input: gccCountries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });

  logger.info("[Aquora] Seeding stock location (Dubai)...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Dubai Distribution Centre",
          address: {
            city: "Dubai",
            country_code: "AE",
            address_1: "Dubai Investment Park",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Aquora GCC delivery",
    type: "shipping",
    service_zones: [
      {
        name: "GCC",
        geo_zones: gccCountries.map((country_code) => ({
          country_code,
          type: "country",
        })),
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Delivered across the UAE in 2-4 working days.",
          code: "standard",
        },
        prices: [
          { currency_code: "aed", amount: 30 },
          { region_id: region.id, amount: 30 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "Express Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Next-day delivery within Dubai & Abu Dhabi.",
          code: "express",
        },
        prices: [
          { currency_code: "aed", amount: 75 },
          { region_id: region.id, amount: 75 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [salesChannel.id] },
  });

  logger.info("[Aquora] Seeding categories...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: catalog.map((c, i) => ({
        name: c.category.name,
        handle: c.category.handle,
        description: c.category.description,
        is_active: true,
        rank: i,
      })),
    },
  });
  const categoryByHandle: Record<string, string> = {};
  for (const c of categoryResult) {
    categoryByHandle[(c as any).handle] = c.id;
  }

  logger.info("[Aquora] Seeding products by category...");
  let productCount = 0;
  for (const cat of catalog) {
    const categoryId = categoryByHandle[cat.category.handle];
    const products = cat.products.map((p) => {
      const optionTitle = p.option_title || "Type";
      const values = p.variants.map((v) => v.title);
      return {
        title: p.title,
        subtitle: p.subtitle,
        handle: p.handle,
        description: buildDescription(p),
        status: ProductStatus.PUBLISHED,
        category_ids: categoryId ? [categoryId] : [],
        shipping_profile_id: shippingProfile.id,
        material: p.material,
        metadata: {
          house_line: p.house_line || null,
          image_hint: p.image_hint || null,
        },
        options: [{ title: optionTitle, values }],
        variants: p.variants.map((v) => ({
          title: v.title,
          sku: v.sku,
          manage_inventory: true,
          options: { [optionTitle]: v.title },
          prices: [{ amount: v.price_aed, currency_code: "aed" }],
        })),
        sales_channels: [{ id: salesChannel.id }],
      };
    });

    await createProductsWorkflow(container).run({ input: { products } });
    productCount += products.length;
    logger.info(`[Aquora]   ${cat.category.name}: ${products.length} products`);
  }

  logger.info("[Aquora] Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 500,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info(
    `[Aquora] Seed complete: ${categoryResult.length} categories, ${productCount} products.`
  );
  logger.info(
    `[Aquora] PUBLISHABLE_KEY=${(publishableApiKey as any).token}`
  );
}
