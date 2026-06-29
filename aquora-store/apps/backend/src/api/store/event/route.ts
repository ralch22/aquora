import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { writeUserEvent, RetailEventType } from "../../../lib/retail";

const VALID = new Set<RetailEventType>([
  "home-page-view",
  "detail-page-view",
  "add-to-cart",
  "purchase-complete",
  "search",
]);

// Phase 2: ingest a storefront user event into Google Retail (feeds the recommendation
// models + personalised search ranking). Fire-and-forget — always 200 so analytics never
// blocks the shopper, and Retail write failures are logged server-side, not surfaced.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b = (req.body || {}) as {
    eventType?: string;
    visitorId?: string;
    productHandles?: string[];
    searchQuery?: string;
  };
  const eventType = String(b.eventType || "") as RetailEventType;
  if (!VALID.has(eventType)) {
    res.status(400).json({ error: "Invalid eventType." });
    return;
  }
  const visitorId = String(b.visitorId || "anon").slice(0, 64);
  const productHandles = Array.isArray(b.productHandles)
    ? b.productHandles.map((h) => String(h)).filter(Boolean).slice(0, 30)
    : undefined;
  const searchQuery = b.searchQuery ? String(b.searchQuery).slice(0, 256) : undefined;

  // Don't await — the response returns immediately; the write completes in the background.
  void writeUserEvent(eventType, { visitorId, productHandles, searchQuery });
  res.json({ ok: true });
}
