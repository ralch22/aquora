import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

// Pool/spa/fountain equipment manufacturers commonly present in the catalogue titles.
const BRANDS = [
  "AstralPool", "Astral", "Hayward", "Pentair", "Zodiac", "Atecpool", "Pahlen", "Rosa Gres",
  "Emaux", "Kripsol", "Espa", "Bayrol", "Fluidra", "Behncke", "Certikin", "Waterco", "Davey",
  "Grundfos", "Speck", "Aquark", "Cepex", "Praher", "Dinotec", "Ospa", "Peraqua", "Gemas",
  "Idegis", "Sugar Valley", "BWT", "Lovibond", "Maytronics", "Dolphin", "CCEI", "Seko", "Wiltec",
  "Aqualux", "Aquadart", "Magiline", "Procopi", "Weltico", "VagnerPool", "Vagner", "Microwell",
];

function detectBrand(title: string): string {
  const t = title || "";
  for (const b of BRANDS) {
    const re = new RegExp("\\b" + b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (re.test(t)) return b;
  }
  // fall back to the leading word if it looks like a proper noun
  const first = t.trim().split(/\s+/)[0] || "";
  return /^[A-Z][A-Za-z0-9-]{1,}$/.test(first) ? first.replace(/[^A-Za-z0-9&-]/g, "") : "Generic";
}

export default async function extractBrands({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const counts = new Map<string, number>();
  let offset = 0;
  const take = 500;
  let updated = 0;
  while (true) {
    const { data } = await query.graph({ entity: "product", fields: ["id", "title", "metadata"], pagination: { take, skip: offset } });
    if (!data.length) break;
    const updates = (data as any[]).map((p) => {
      const brand = detectBrand(p.title);
      counts.set(brand, (counts.get(brand) || 0) + 1);
      return { id: p.id, metadata: { ...(p.metadata || {}), brand } };
    });
    await updateProductsWorkflow(container).run({ input: { products: updates as any } });
    updated += updates.length;
    offset += take;
    logger.info(`[brands] ${updated}`);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 18);
  logger.info(`[brands] DONE: ${updated} products, ${counts.size} distinct brands`);
  logger.info(`[brands] top: ${top.map(([b, n]) => `${b}(${n})`).join(", ")}`);
}
