import { QueryContext } from "@medusajs/framework/utils";

// One rich, tool-grounded product card — the single shape the shopping agent uses for both
// tool results AND the final suggestions the storefront renders. Every card carries a real
// variant_id + AED price + stock, so the chat "Add to cart" button never fabricates a SKU.
export type Card = {
  handle: string;
  title: string;
  category: string | null;
  brand: string | null;
  variant_id: string | null;
  price: number | null; // AED, major units
  thumbnail: string | null;
  in_stock: boolean;
  description?: string | null;
};

// Hydrate an ordered list of product handles into Cards. Reuses the region + QueryContext
// price-resolution pattern from api/store/search/route.ts (buildCards) so prices match the
// rest of the storefront. Preserves input order (= Retail relevance order). Catalogue is
// single-variant per product, so variants[0] is the buyable variant.
export async function hydrateProducts(
  graph: any,
  handles: string[],
  regionId?: string
): Promise<Card[]> {
  if (!handles.length) return [];
  try {
    const { data } = await graph.graph({
      entity: "product",
      fields: [
        "handle",
        "title",
        "description",
        "thumbnail",
        "images.url",
        "categories.name",
        "metadata",
        "variants.id",
        "variants.calculated_price.*",
      ],
      filters: { handle: handles, status: "published" } as any,
      pagination: { take: handles.length },
      ...(regionId
        ? {
            context: {
              variants: {
                calculated_price: QueryContext({
                  region_id: regionId,
                  currency_code: "aed",
                }),
              },
            },
          }
        : {}),
    } as any);

    const byHandle = new Map((data as any[]).map((p) => [p.handle, p]));
    return handles
      .map((h) => byHandle.get(h))
      .filter(Boolean)
      .map((p: any): Card => {
        const v = p.variants?.[0];
        // The catalogue is purchasable (orders place fine); the inventory_quantity link does
        // not resolve reliably through this graph (returns 0), so we don't claim OOS here —
        // a genuinely unavailable item just fails add-to-cart gracefully. Availability is
        // having a buyable variant.
        const inStock = !!v?.id;
        return {
          handle: p.handle,
          title: p.title,
          category: p.categories?.[0]?.name || null,
          brand: (p.metadata?.brand as string) || null,
          variant_id: v?.id || null,
          price: v?.calculated_price?.calculated_amount ?? null,
          thumbnail: p.thumbnail || p.images?.[0]?.url || null,
          in_stock: inStock,
          description: p.description || null,
        };
      });
  } catch (e) {
    // Surface the failure (a Medusa field rename would otherwise make every card silently
    // vanish and the agent report "nothing found").
    console.warn(`[product-lookup] hydrate error: ${(e as Error)?.message || e}`);
    return [];
  }
}

export type Spec = { name: string; value: string };

// A comparison row: everything a Card has, plus the scraped factual specs + key features so the
// side-by-side compare table can align attributes across products. Used by /store/compare.
export type CompareItem = Card & { specs: Spec[]; features: string[] };

// Hydrate handles into rich comparison items (Card fields + metadata.specs + metadata.features).
// Same region/price-context pattern as hydrateProducts so prices match the storefront.
export async function hydrateCompareProducts(
  graph: any,
  handles: string[],
  regionId?: string
): Promise<CompareItem[]> {
  if (!handles.length) return [];
  try {
    const { data } = await graph.graph({
      entity: "product",
      fields: [
        "handle",
        "title",
        "description",
        "thumbnail",
        "images.url",
        "categories.name",
        "metadata",
        "variants.id",
        "variants.calculated_price.*",
      ],
      filters: { handle: handles, status: "published" } as any,
      pagination: { take: handles.length },
      ...(regionId
        ? {
            context: {
              variants: {
                calculated_price: QueryContext({
                  region_id: regionId,
                  currency_code: "aed",
                }),
              },
            },
          }
        : {}),
    } as any);

    const byHandle = new Map((data as any[]).map((p) => [p.handle, p]));
    return handles
      .map((h) => byHandle.get(h))
      .filter(Boolean)
      .map((p: any): CompareItem => {
        const v = p.variants?.[0];
        const specs = Array.isArray(p.metadata?.specs)
          ? (p.metadata.specs as any[])
              .filter((s) => s && s.name && s.value != null)
              .map((s) => ({ name: String(s.name), value: String(s.value) }))
          : [];
        const features = Array.isArray(p.metadata?.features)
          ? (p.metadata.features as any[]).map((f) => String(f)).filter(Boolean)
          : [];
        return {
          handle: p.handle,
          title: p.title,
          category: p.categories?.[0]?.name || null,
          brand: (p.metadata?.brand as string) || null,
          variant_id: v?.id || null,
          price: v?.calculated_price?.calculated_amount ?? null,
          thumbnail: p.thumbnail || p.images?.[0]?.url || null,
          in_stock: !!v?.id,
          description: p.description || null,
          specs,
          features,
        };
      });
  } catch (e) {
    console.warn(`[product-lookup] compare hydrate error: ${(e as Error)?.message || e}`);
    return [];
  }
}
