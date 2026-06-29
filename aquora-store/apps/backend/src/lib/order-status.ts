// Phase 4 (support): read-only order lookup, shared by the /store/order-status route and Ask
// Aqua's support tool. Requires BOTH the order number (display_id) AND the email on the order,
// so it can never leak another customer's order. Returns high-level status only — no PII
// beyond what the requester already supplied.
export type OrderStatus = {
  found: boolean;
  number?: number;
  placed?: string;
  status?: string;
  payment?: string;
  fulfillment?: string;
  total?: number;
  currency?: string;
  items?: { title: string; quantity: number }[];
};

export async function lookupOrderStatus(
  graph: any,
  opts: { order: string | number; email: string }
): Promise<OrderStatus> {
  const displayId = parseInt(String(opts.order || "").replace(/[^0-9]/g, ""), 10);
  const email = String(opts.email || "").trim().toLowerCase();
  if (!displayId || !email) return { found: false };
  try {
    const { data } = await graph.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "status",
        "payment_status",
        "fulfillment_status",
        "created_at",
        "total",
        "currency_code",
        "items.title",
        "items.quantity",
      ],
      filters: { display_id: displayId } as any,
      pagination: { take: 1 },
    });
    const o = (data as any[])[0];
    if (!o || String(o.email || "").toLowerCase() !== email) return { found: false };
    return {
      found: true,
      number: o.display_id,
      placed: o.created_at,
      status: o.status,
      payment: o.payment_status,
      fulfillment: o.fulfillment_status,
      total: o.total,
      currency: String(o.currency_code || "AED").toUpperCase(),
      items: (o.items || []).map((i: any) => ({ title: i.title, quantity: i.quantity })),
    };
  } catch (e) {
    // Log without echoing the customer's email/order# (avoid PII in logs); distinguishes a
    // real backend outage from a genuinely wrong order#/email (both return {found:false}).
    console.warn(`[order-status] lookup error: ${(e as Error)?.message || e}`);
    return { found: false };
  }
}
