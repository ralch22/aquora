import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

// Ingest AI-generated, spec-grounded ORIGINAL copy
// (data/enrichment.json = { [handle]: { overview, features[], idealFor } })
// into product metadata. Run after scripts/enrich-content.mjs.
// Mirrors import-specs.ts (exact + normalized-handle matching).
const ENRICH_PATH = process.env.ENRICH_PATH || "/Users/admin/Documents/aquora/data/enrichment.json";

type Enrichment = { overview?: string; features?: string[]; idealFor?: string; __error?: string };

export default async function importEnrichment({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const raw: Record<string, Enrichment> = JSON.parse(fs.readFileSync(ENRICH_PATH, "utf-8"));
  // Source handles can carry dots (e.g. "d.e.-filter") that the import slugged to
  // hyphens, so index by normalized handle too (same as import-specs.ts).
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120).replace(/^-+|-+$/g, "");
  const valid = (e?: Enrichment) =>
    !!e && !e.__error && typeof e.overview === "string" && e.overview.length > 0 && Array.isArray(e.features) && e.features.length > 0;

  const byHandle: Record<string, Enrichment> = {};
  const normIndex: Record<string, Enrichment> = {};
  for (const [h, v] of Object.entries(raw)) {
    if (!valid(v)) continue;
    byHandle[h] = v;
    normIndex[norm(h)] = v;
  }
  const lookup = (handle: string) => byHandle[handle] || normIndex[norm(handle)];
  logger.info(`[enrich] loaded ${Object.keys(byHandle).length} valid enrichments`);

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
      .map((p) => ({ p, e: lookup(p.handle) }))
      .filter(({ e }) => valid(e))
      .map(({ p, e }) => ({
        id: p.id,
        metadata: {
          ...(p.metadata || {}),
          overview: e!.overview,
          features: e!.features!.slice(0, 6),
          idealFor: e!.idealFor || "",
        },
      }));

    if (updates.length) {
      await updateProductsWorkflow(container).run({ input: { products: updates as any } });
      updated += updates.length;
    }
    scanned += data.length;
    offset += take;
    logger.info(`[enrich] scanned ${scanned}, enriched ${updated}`);
  }
  logger.info(`[enrich] DONE: ${updated} products updated with overview/features/idealFor`);
}
