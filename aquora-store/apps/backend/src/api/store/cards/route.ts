import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { hydrateProducts } from "../../../lib/product-lookup";

// Hydrate a list of product handles into rich cards (title, AED price, thumbnail, stock,
// variant_id) preserving order. Powers the client-side Wishlist + Recently-viewed surfaces,
// which hold only handles in localStorage. Capped at 50 handles per call.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const raw = String(req.query.handles || "");
  const handles = raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 50);
  if (!handles.length) {
    res.json({ products: [] });
    return;
  }
  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}
  const products = await hydrateProducts(graph, handles, regionId);
  res.json({ products });
}
