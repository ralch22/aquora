import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules, QueryContext } from "@medusajs/framework/utils";
import { retailSearch, PRICE_BANDS } from "../../../lib/retail";

const STOP = new Set(["pool", "spa", "the", "for", "with", "you", "and", "any", "best"]);
const PAGE_SIZE = 24;
const MAX_PAGE = 1000; // cap deep pagination (each Retail call is billable; deep offsets return empty)

// Accept ?brand=a,b or repeated ?brand=a&brand=b
function parseList(v: unknown): string[] {
  const arr = Array.isArray(v) ? v : v != null ? [v] : [];
  return arr
    .flatMap((x) => String(x).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

// Whitelist facet values to characters that occur in real brand/category names
// (letters, numbers, space, & / - _ .) — strips quotes, commas, parens and boolean
// operators so a crafted value can neither break out of the ANY("…") literal nor
// inject filter clauses.
function sanitizeFacet(s: string): string {
  return s.replace(/[^\p{L}\p{N}\s\-_.&/]/gu, "").trim();
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = (req.query.q || "").toString().trim();

  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productService = req.scope.resolve(Modules.PRODUCT);

  const page = Math.max(1, Math.min(MAX_PAGE, parseInt((req.query.page || "1").toString(), 10) || 1));
  const brands = parseList(req.query.brand).map(sanitizeFacet).filter(Boolean);
  const cats = parseList(req.query.cat).map(sanitizeFacet).filter(Boolean);
  const priceKey = (req.query.price || "").toString().trim();
  const band = PRICE_BANDS.find((b) => b.key === priceKey);

  // Sort. Retail orderBy is unreliable on this catalogue, so non-relevance sorts are
  // applied route-side over the top SORT_CAP results (exact for typical browse sizes).
  const sort = (req.query.sort || "relevance").toString();
  const SORTED = sort === "price-asc" || sort === "price-desc" || sort === "name-asc";
  const SORT_CAP = 250;
  const sortCards = (cards: any[]) => {
    const c = [...cards];
    if (sort === "price-asc") c.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "price-desc") c.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    else if (sort === "name-asc") c.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    return c;
  };

  // Browse mode: no search term, but a category/brand/price scope is present (Retail
  // supports an empty query + filter as a browse request). Powers faceted category pages.
  const browse = !query && (cats.length > 0 || brands.length > 0 || !!band);
  if (!query && !browse) {
    res.json({ products: [], facets: {}, total: 0, page: 1, pageSize: PAGE_SIZE, source: "none" });
    return;
  }

  // Build the Retail filter expression from the active facet selections.
  const parts: string[] = [];
  if (brands.length) parts.push(`brands: ANY(${brands.map((b) => `"${b}"`).join(",")})`);
  if (cats.length) parts.push(`categories: ANY(${cats.map((c) => `"${c}"`).join(",")})`);
  if (band) parts.push(band.max === undefined ? `price >= ${band.min}` : `price >= ${band.min} AND price < ${band.max}`);
  const filter = parts.join(" AND ");

  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}

  // Hydrate ordered product cards for a list of handles.
  const buildCards = async (handles: string[]): Promise<any[]> => {
    if (!handles.length) return [];
    try {
      const { data } = await graph.graph({
        entity: "product",
        fields: ["handle", "title", "thumbnail", "images.url", "categories.name", "metadata", "variants.calculated_price.*"],
        filters: { handle: handles } as any,
        pagination: { take: handles.length },
        ...(regionId ? { context: { variants: { calculated_price: QueryContext({ region_id: regionId, currency_code: "aed" }) } } } : {}),
      } as any);
      const byHandle = new Map((data as any[]).map((p) => [p.handle, p]));
      return handles
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
    } catch {
      return [];
    }
  };

  let source = "retail";
  let total = 0;
  let facetsOut: Record<string, any[]> = {};
  let products: any[] = [];

  const visitorId = (req.query.v || "anon").toString();
  const retail = await retailSearch(query, {
    visitorId,
    pageSize: SORTED ? 100 : PAGE_SIZE,
    offset: SORTED ? 0 : (page - 1) * PAGE_SIZE,
    filter,
  });

  if (retail !== null) {
    // Retail responded — authoritative, even with zero results (an over-filtered query
    // must show "no matches", NOT silently fall back to an unfiltered Medusa search).
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
    if (!SORTED) {
      products = await buildCards(retail.ids);
    } else {
      // Collect up to SORT_CAP relevance-ranked ids, hydrate, sort route-side, paginate.
      const ids = [...retail.ids];
      for (let off = 100; off < Math.min(total, SORT_CAP); off += 100) {
        const more = await retailSearch(query, { visitorId, pageSize: 100, offset: off, filter });
        if (!more || !more.ids.length) break;
        ids.push(...more.ids);
      }
      const sorted = sortCards(await buildCards(ids));
      total = sorted.length;
      products = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    }
  } else {
    // Retail unavailable → tokenized Medusa fallback that RE-APPLIES the active facets,
    // so a shopper's brand/category/price selections are still honoured during an outage.
    source = "medusa";
    const words = query.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    const terms = words.length ? words.slice(0, 4) : query ? [query.toLowerCase()] : [];
    const score = new Map<string, { h: string; n: number }>();
    for (const t of terms) {
      try {
        const ps = await productService.listProducts({ q: t } as any, { take: 100 } as any);
        for (const p of ps) {
          const e = score.get(p.id) || { h: p.handle, n: 0 };
          e.n++;
          score.set(p.id, e);
        }
      } catch {}
    }
    const ranked = [...score.values()].sort((a, b) => b.n - a.n).map((e) => e.h).slice(0, 300);
    let cards = await buildCards(ranked);
    if (brands.length) cards = cards.filter((c) => c.brand && brands.includes(c.brand));
    if (cats.length) cards = cards.filter((c) => c.category && cats.includes(c.category));
    if (band) cards = cards.filter((c) => c.price != null && c.price >= band.min && (band.max === undefined || c.price < band.max));
    if (SORTED) cards = sortCards(cards);
    total = cards.length;
    products = cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  res.json({ products, facets: facetsOut, total, page, pageSize: PAGE_SIZE, source, query });
}
