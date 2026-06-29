import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { hydrateCompareProducts } from "../../../lib/product-lookup";

// Hydrate up to 4 product handles into rich comparison items (Card fields + metadata.specs +
// key features) so the /compare page can render a real side-by-side table aligned on attribute
// names. Order is preserved; the storefront holds only handles in localStorage.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const raw = String(req.query.handles || "");
  const handles = raw
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (!handles.length) {
    res.json({ products: [] });
    return;
  }
  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}
  const products = await hydrateCompareProducts(graph, handles, regionId);
  res.json({ products });
}
