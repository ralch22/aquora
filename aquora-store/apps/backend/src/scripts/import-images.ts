import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

// Replace each existing product's images with the FULL set of GCS gallery images.
// Reads data/image-map.json = { [handle]: [public GCS webp urls] } produced by
// scripts/download-images-to-gcs.mjs (NOT data/images.json, which holds source urls).
// updateProductsWorkflow({images}) REPLACES the images relation (index 0 = original
// main image, so the thumbnail column is unaffected). Idempotent. Run AFTER the
// uploader has pushed all <slug>/<n>.webp objects to GCS.
const IMAGE_MAP_PATH = process.env.IMAGE_MAP_PATH || "/Users/admin/Documents/aquora/data/image-map.json";

export default async function importImages({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const raw: Record<string, string[]> = JSON.parse(fs.readFileSync(IMAGE_MAP_PATH, "utf-8"));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
  const byHandle: Record<string, string[]> = {};
  const normIndex: Record<string, string[]> = {};
  for (const [h, urls] of Object.entries(raw)) {
    if (!Array.isArray(urls) || !urls.length) continue;
    byHandle[h] = urls;
    normIndex[norm(h)] = urls;
  }
  const lookup = (handle: string) => byHandle[handle] || normIndex[norm(handle)];
  logger.info(`[images] loaded image sets for ${Object.keys(byHandle).length} handles`);

  let offset = 0;
  const take = 500;
  let scanned = 0;
  let updated = 0;
  let multi = 0;
  while (true) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
      pagination: { take, skip: offset },
    });
    if (!data.length) break;

    const updates = (data as any[])
      .map((p) => ({ p, urls: lookup(p.handle) }))
      .filter(({ urls }) => urls?.length)
      .map(({ p, urls }) => {
        if (urls!.length > 1) multi++;
        return { id: p.id, images: urls!.map((url) => ({ url })) };
      });

    if (updates.length) {
      await updateProductsWorkflow(container).run({ input: { products: updates as any } });
      updated += updates.length;
    }
    scanned += data.length;
    offset += take;
    logger.info(`[images] scanned ${scanned}, updated ${updated} (${multi} with >1 image)`);
  }
  logger.info(`[images] DONE: ${updated} products updated (${multi} now have multiple images)`);
}
