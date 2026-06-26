import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";
import fs from "fs";

// Ingest scraped factual spec tables (data/specs.json = { [handle]: [{name, value}] })
// into product metadata.specs. Run after scripts/scrape-specs.mjs.
const SPECS_PATH = process.env.SPECS_PATH || "/Users/admin/Documents/aquora/data/specs.json";

export default async function importSpecs({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const specsByHandle: Record<string, { name: string; value: string }[]> = JSON.parse(
    fs.readFileSync(SPECS_PATH, "utf-8")
  );
  logger.info(`[specs] loaded specs for ${Object.keys(specsByHandle).length} handles`);

  let offset = 0;
  const take = 500;
  let scanned = 0;
  let withSpecs = 0;
  while (true) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "metadata"],
      pagination: { take, skip: offset },
    });
    if (!data.length) break;

    const updates = (data as any[])
      .filter((p) => specsByHandle[p.handle]?.length)
      .map((p) => ({ id: p.id, metadata: { ...(p.metadata || {}), specs: specsByHandle[p.handle] } }));

    if (updates.length) {
      await updateProductsWorkflow(container).run({ input: { products: updates as any } });
      withSpecs += updates.length;
    }
    scanned += data.length;
    offset += take;
    logger.info(`[specs] scanned ${scanned}, with specs ${withSpecs}`);
  }
  logger.info(`[specs] DONE: ${withSpecs} products updated with specs`);
}
