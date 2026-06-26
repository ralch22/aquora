import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules, QueryContext } from "@medusajs/framework/utils";
import { retailSearch } from "../../../lib/retail";

const STOP = new Set(["pool","spa","the","for","with","you","and","any","best"]);

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query.q || "").toString().trim();
  if (!q) { res.json({ products: [], source: "none" }); return; }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productService = req.scope.resolve(Modules.PRODUCT);

  let regionId: string | undefined;
  try { const { data } = await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } }); regionId = data[0]?.id; } catch {}

  // 1) Try Google Retail (semantic). 2) Fall back to tokenized Medusa search.
  let source = "retail";
  let handles: string[] | null = await retailSearch(q, (req.query.v || "anon").toString());
  if (!handles || !handles.length) {
    source = "medusa";
    const words = q.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    const terms = words.length ? words.slice(0, 4) : [q.toLowerCase()];
    const score = new Map<string, { h: string; n: number }>();
    for (const t of terms) {
      try {
        const ps = await productService.listProducts({ q: t } as any, { take: 24 } as any);
        for (const p of ps) { const e = score.get(p.id) || { h: p.handle, n: 0 }; e.n++; score.set(p.id, e); }
      } catch {}
    }
    handles = [...score.values()].sort((a, b) => b.n - a.n).slice(0, 24).map((e) => e.h);
  }
  if (!handles.length) { res.json({ products: [], source }); return; }

  let cards: any[] = [];
  try {
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle", "title", "thumbnail", "images.url", "categories.name", "variants.calculated_price.*"],
      filters: { handle: handles } as any,
      pagination: { take: handles.length },
      ...(regionId ? { context: { variants: { calculated_price: QueryContext({ region_id: regionId, currency_code: "aed" }) } } } : {}),
    } as any);
    const byHandle = new Map((data as any[]).map((p) => [p.handle, p]));
    cards = handles
      .map((h) => byHandle.get(h))
      .filter(Boolean)
      .map((p: any) => ({
        handle: p.handle,
        title: p.title,
        thumbnail: p.thumbnail || p.images?.[0]?.url || null,
        category: p.categories?.[0]?.name || null,
        price: p.variants?.[0]?.calculated_price?.calculated_amount ?? null,
      }));
  } catch {}

  res.json({ products: cards, source, query: q });
}
