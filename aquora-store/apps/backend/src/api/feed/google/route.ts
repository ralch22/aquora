import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils";

// Google Merchant Center product feed (RSS 2.0 + g: namespace). PUBLIC route (outside /store,
// so no publishable-key requirement) — submit this URL in Merchant Center. Reuses the exact
// product + AED-price graph query from lib/product-lookup.ts. Only buyable, priced products
// with an image are included; made-to-order catalogue => availability "in_stock".
const SITE = (process.env.STORE_URL || "https://aquora.ae").replace(/\/$/, "");
const CC = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ae";
const PAGE = 400;

function esc(s: unknown): string {
  return String(s ?? "").replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string)
  );
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}

  const items: string[] = [];
  try {
    for (let offset = 0, guard = 0; guard < 60; guard++, offset += PAGE) {
      const { data } = await graph.graph({
        entity: "product",
        fields: [
          "handle",
          "title",
          "description",
          "thumbnail",
          "images.url",
          "categories.name",
          "metadata",
          "variants.id",
          "variants.calculated_price.*",
        ],
        filters: { status: "published" } as any,
        pagination: { take: PAGE, skip: offset },
        ...(regionId
          ? {
              context: {
                variants: {
                  calculated_price: QueryContext({ region_id: regionId, currency_code: "aed" }),
                },
              },
            }
          : {}),
      } as any);

      for (const p of data as any[]) {
        const v = p.variants?.[0];
        const price = v?.calculated_price?.calculated_amount;
        const img = p.thumbnail || p.images?.[0]?.url;
        // Google requires a real price + image; skip anything that can't be a valid offer.
        if (!v?.id || price == null || !img) continue;
        const brand = (p.metadata?.brand as string) || "Aquora";
        const desc = String(p.description || p.title || "").slice(0, 4900);
        const cat = p.categories?.[0]?.name;
        items.push(
          "<item>" +
            `<g:id>${esc(p.handle)}</g:id>` +
            `<title>${esc(p.title)}</title>` +
            `<description>${esc(desc)}</description>` +
            `<link>${SITE}/${CC}/products/${esc(p.handle)}</link>` +
            `<g:image_link>${esc(img)}</g:image_link>` +
            `<g:availability>in_stock</g:availability>` +
            `<g:price>${Number(price).toFixed(2)} AED</g:price>` +
            `<g:brand>${esc(brand)}</g:brand>` +
            `<g:condition>new</g:condition>` +
            `<g:identifier_exists>no</g:identifier_exists>` +
            (cat ? `<g:product_type>${esc(cat)}</g:product_type>` : "") +
            "</item>"
        );
      }
      if ((data as any[]).length < PAGE) break;
    }
  } catch (e) {
    console.warn(`[feed] error: ${(e as Error)?.message || e}`);
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>' +
    "<title>Aquora — Pool, Spa, Pond &amp; Fountain Equipment</title>" +
    `<link>${SITE}</link>` +
    "<description>Genuine pool, spa, pond and fountain equipment, delivered across the UAE &amp; GCC.</description>" +
    items.join("") +
    "</channel></rss>";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(xml);
}
