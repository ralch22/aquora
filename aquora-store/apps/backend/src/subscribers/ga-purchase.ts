import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

// Server-side GA4 conversion via Measurement Protocol — fires `purchase` when an order
// is placed, independent of the browser (ad-blocker-proof, reliable). Gated: no-op unless
// GA4_MEASUREMENT_ID + GA4_MP_API_SECRET are set. client_id is captured at checkout into
// order.metadata.ga_client_id (from the _ga cookie) for proper session attribution.
export default async function gaPurchaseSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID
  const API_SECRET = process.env.GA4_MP_API_SECRET
  if (!MEASUREMENT_ID || !API_SECRET) return

  try {
    const orderService = container.resolve(Modules.ORDER)
    const order: any = await orderService.retrieveOrder(event.data.id, {
      relations: ["items"],
    })

    const clientId = (order.metadata?.ga_client_id as string) || `${event.data.id}.0`
    const items = (order.items || []).map((i: any) => ({
      item_id: i.variant_id || i.id,
      item_name: i.product_title || i.title,
      price: i.unit_price,
      quantity: i.quantity,
    }))

    const body = {
      client_id: clientId,
      events: [
        {
          name: "purchase",
          params: {
            transaction_id: order.id,
            currency: (order.currency_code || "aed").toUpperCase(),
            value: Number(order.total || 0),
            items,
          },
        },
      ],
    }

    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    )
  } catch {
    // best-effort; never block the order flow
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
