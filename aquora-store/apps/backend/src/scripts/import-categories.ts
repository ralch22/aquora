import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow, updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

// Rebuild the category tree from the source breadcrumbs (data/categories.json =
// { [handle]: [{name, slug}, ...] }) and reassign every product to its real source
// categories, replacing the earlier keyword classification. Run after scrape-categories.mjs.
const CATS_PATH = process.env.CATS_PATH || "/Users/admin/Documents/aquora/data/categories.json";

export default async function importCategories({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModule: any = container.resolve(Modules.PRODUCT);

  const byHandle: Record<string, { name: string; slug: string }[]> = JSON.parse(fs.readFileSync(CATS_PATH, "utf-8"));

  // 1) Unique source category nodes: slug -> { name, parentSlug, depth }
  const nodes = new Map<string, { name: string; parent: string | null; depth: number }>();
  for (const path of Object.values(byHandle)) {
    for (let i = 0; i < path.length; i++) {
      const { name, slug } = path[i];
      if (!slug || nodes.has(slug)) continue;
      nodes.set(slug, { name, parent: i > 0 ? path[i - 1].slug : null, depth: i });
    }
  }
  logger.info(`[cats] ${nodes.size} unique source categories from ${Object.keys(byHandle).length} products`);

  // 2) Clean slate: delete existing categories (the keyword tree) to avoid handle collisions.
  const { data: existing } = await query.graph({ entity: "product_category", fields: ["id"], pagination: { take: 1000 } });
  if (existing.length) {
    await productModule.deleteProductCategories((existing as any[]).map((c) => c.id));
    logger.info(`[cats] deleted ${existing.length} old categories`);
  }

  // 3) Create the source tree, parents before children (by depth).
  const idBySlug = new Map<string, string>();
  const sorted = [...nodes.entries()].sort((a, b) => a[1].depth - b[1].depth);
  for (const [slug, node] of sorted) {
    const parent_category_id = node.parent ? idBySlug.get(node.parent) || null : null;
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ name: node.name, handle: slug, is_active: true, is_internal: false, parent_category_id }] },
    });
    idBySlug.set(slug, (result as any[])[0].id);
  }
  logger.info(`[cats] created ${idBySlug.size} categories`);

  // 4) Reassign products to their source categories (leaf + ancestors), replacing old.
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
  const normIndex: Record<string, { name: string; slug: string }[]> = {};
  for (const [h, v] of Object.entries(byHandle)) normIndex[norm(h)] = v;
  const lookup = (h: string) => byHandle[h] || normIndex[norm(h)];

  let offset = 0;
  const take = 500;
  let scanned = 0;
  let updated = 0;
  while (true) {
    const { data } = await query.graph({ entity: "product", fields: ["id", "handle"], pagination: { take, skip: offset } });
    if (!data.length) break;
    const updates = (data as any[])
      .map((p) => {
        const path = lookup(p.handle);
        if (!path?.length) return null;
        const ids = path.map((c) => idBySlug.get(c.slug)).filter(Boolean) as string[];
        return ids.length ? { id: p.id, category_ids: ids } : null;
      })
      .filter(Boolean) as any[];
    if (updates.length) {
      await updateProductsWorkflow(container).run({ input: { products: updates } });
      updated += updates.length;
    }
    scanned += data.length;
    offset += take;
    logger.info(`[cats] scanned ${scanned}, reassigned ${updated}`);
  }
  logger.info(`[cats] DONE: ${idBySlug.size} categories, ${updated} products reassigned`);
}
