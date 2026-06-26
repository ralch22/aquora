import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules, QueryContext } from "@medusajs/framework/utils";
import { retailSearch, PRICE_BANDS } from "../../../lib/retail";

const STOP = new Set(["pool", "spa", "the", "for", "with", "you", "and", "any", "best"]);
const PAGE_SIZE = 24;

// Accept ?brand=a,b or repeated ?brand=a&brand=b
function parseList(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : v != null ? [v] : [];
  return arr
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

// Quote a facet value for a Retail ANY(...) filter clause.
function q(s: string): string {
  return `"${s.replace(/["\\]/g, "")}"`;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = (req.query.q || "").toString().trim();
  if (!query) {
    res.json({ products: [], facets: {}, total: 0, page: 1, pageSize: PAGE_SIZE, source: "none" });
    return;
  }

  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productService = req.scope.resolve(Modules.PRODUCT);

  const page = Math.max(1, parseInt((req.query.page || "1").toString(), 10) || 1);
  const brands = parseList(req.query.brand);
  const cats = parseList(req.query.cat);
  const priceKey = (req.query.price || "").toString().trim();

  // Build the Retail filter expression from the active facet selections.
  const parts: string[] = [];
  if (brands.length) parts.push(`brands: ANY(${brands.map(q).join(",")})`);
  if (cats.length) parts.push(`categories: ANY(${cats.map(q).join(",")})`);
  const band = PRICE_BANDS.find((b) => b.key === priceKey);
  if (band) {
    parts.push(band.max === undefined ? `price >= ${band.min}` : `price: IN(${band.min}.0, ${band.max}.0)`);
  }
  const filter = parts.join(" AND ");

  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}

  // 1) Google Retail (semantic + facets + pagination). 2) Tokenized Medusa fallback.
  let source = "retail";
  let total = 0;
  let facetsOut: Record<string, any[]> = {};
  let handles: string[] = [];

  const retail = await retailSearch(query, {
    visitorId: (req.query.v || "anon").toString(),
    pageSize: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    filter,
  });

  if (retail && (retail.ids.length || retail.total)) {
    handles = retail.ids;
    total = retail.total;
    const byKey: Record<string, string> = { brands: "brands", categories: "categories", price: "price" };
    for (const f of retail.facets) {
      const name = byKey[f.key];
      if (!name) continue;
      if (name === "price") {
        facetsOut.price = f.values
          .map((v) => {
            const b = PRICE_BANDS.find((pb) => pb.key === v.value);
            return b ? { value: b.key, label: b.label, count: v.count } : null;
          })
          .filter(Boolean) as any[];
      } else {
        facetsOut[name] = f.values.map((v) => ({ value: v.value, label: v.value, count: v.count }));
      }
    }
  } else {
    source = "medusa";
    const words = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    const terms = words.length ? words.slice(0, 4) : [query.toLowerCase()];
    const score = new Map<string, { h: string; n: number }>();
    for (const t of terms) {
      try {
        const ps = await productService.listProducts({ q: t } as any, { take: 48 } as any);
        for (const p of ps) {
          const e = score.get(p.id) || { h: p.handle, n: 0 };
          e.n++;
          score.set(p.id, e);
        }
      } catch {}
    }
    const ranked = [...score.values()].sort((a, b) => b.n - a.n).map((e) => e.h);
    total = ranked.length;
    handles = ranked.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  if (!handles.length) {
    res.json({ products: [], facets: facetsOut, total, page, pageSize: PAGE_SIZE, source, query });
    return;
  }

  let cards: any[] = [];
  try {
    const { data } = await graph.graph({
      entity: "product",
      fields: ["handle", "title", "thumbnail", "images.url", "categories.name", "metadata", "variants.calculated_price.*"],
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
        brand: (p.metadata?.brand as string) || null,
        price: p.variants?.[0]?.calculated_price?.calculated_amount ?? null,
      }));
  } catch {}

  res.json({ products: cards, facets: facetsOut, total, page, pageSize: PAGE_SIZE, source, query });
}
