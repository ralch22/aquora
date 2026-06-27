import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

// Ingest sourced product videos (data/product-videos.json = { [handle]: { youtube, title } })
// into product metadata.video. Topic videos from waterstore.ae's /video/ library mapped to
// the matching product types (cleaners, counter-currents, hot tubs, UV sanitizers).
// Mirrors import-enrichment.ts (exact + normalized-handle matching, metadata merge).
const VIDEOS_PATH = process.env.VIDEOS_PATH || "/Users/admin/Documents/aquora/data/product-videos.json";

type Vid = { youtube?: string; title?: string };

export default async function importVideos({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const raw: Record<string, Vid> = JSON.parse(fs.readFileSync(VIDEOS_PATH, "utf-8"));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
  const valid = (v?: Vid) => !!v && typeof v.youtube === "string" && v.youtube.length > 3;

  const byHandle: Record<string, Vid> = {};
  const normIndex: Record<string, Vid> = {};
  for (const [h, v] of Object.entries(raw)) {
    if (!valid(v)) continue;
    byHandle[h] = v;
    normIndex[norm(h)] = v;
  }
  const lookup = (handle: string) => byHandle[handle] || normIndex[norm(handle)];
  logger.info(`[videos] loaded ${Object.keys(byHandle).length} video assignments`);

  let offset = 0;
  const take = 500;
  let scanned = 0;
  let updated = 0;
  while (true) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "metadata"],
      pagination: { take, skip: offset },
    });
    if (!data.length) break;

    const updates = (data as any[])
      .map((p) => ({ p, v: lookup(p.handle) }))
      .filter(({ v }) => valid(v))
      .map(({ p, v }) => ({
        id: p.id,
        metadata: {
          ...(p.metadata || {}),
          video: { youtube: v!.youtube, title: v!.title || "" },
        },
      }));

    if (updates.length) {
      await updateProductsWorkflow(container).run({ input: { products: updates as any } });
      updated += updates.length;
    }
    scanned += data.length;
    offset += take;
    logger.info(`[videos] scanned ${scanned}, with-video ${updated}`);
  }
  logger.info(`[videos] DONE: ${updated} products got metadata.video`);
}
