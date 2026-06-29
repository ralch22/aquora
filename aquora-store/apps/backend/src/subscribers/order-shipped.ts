import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail, emailEnabled } from "../lib/email"

// Sends a branded "your order is on its way" email when a shipment is created in the Medusa admin.
// Completes the post-purchase journey: order-confirmation (order.placed) → SHIPPED (here) →
// review-request (daily job). Env-gated (no-op without RESEND_API_KEY) and fully defensive: the
// `shipment.created` event only carries the shipment id, so we resolve the parent order via the
// Query graph and simply NO-OP if it can't be resolved or has no email — never blocking anything.
const TEAL = "#0E6E73"
const DARK = "#0A3A42"
const GOLD = "#E0A23B"
const INK = "#0B1F24"
const MUTED = "#6E8C90"

export default async function orderShippedSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!emailEnabled()) return

  const shipmentId = event.data?.id
  if (!shipmentId) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Resolve the order that owns this shipment/fulfillment. The order↔fulfillment link lets us
    // filter the order by its fulfillment id through the remote Query graph.
    let order: any = null
    try {
      const { data } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "email",
          "display_id",
          "currency_code",
          "items.title",
          "items.product_title",
          "items.quantity",
          "shipping_address.first_name",
          "shipping_address.last_name",
          "fulfillments.id",
          "fulfillments.labels.tracking_number",
          "fulfillments.labels.tracking_url",
          "metadata",
        ],
        filters: { fulfillments: { id: shipmentId } } as any,
        pagination: { take: 1 },
      })
      order = data?.[0] || null
    } catch (e) {
      console.warn(`[order-shipped] order resolve failed for shipment ${shipmentId}: ${(e as Error)?.message || e}`)
    }

    if (!order?.email) return

    // Only send once per order (a multi-package order can emit several shipment events).
    if (order.metadata && order.metadata.shipped_email_sent) return

    const ref = order.display_id ? `#${order.display_id}` : order.id
    const sa = order.shipping_address || {}
    const name = [sa.first_name, sa.last_name].filter(Boolean).join(" ") || "there"

    // Pull any tracking off the order's fulfillments' labels.
    const labels = (order.fulfillments || []).flatMap((f: any) => f?.labels || [])
    const tracking = labels.find((l: any) => l?.tracking_number || l?.tracking_url)
    const trackingNumber = tracking?.tracking_number || null
    const trackingUrl = tracking?.tracking_url || null

    const rows = (order.items || [])
      .map(
        (i: any) => `
        <tr><td style="padding:8px 0;border-bottom:1px solid #eef2f2;color:${INK};font-size:14px;">
          ${i.product_title || i.title}${i.quantity > 1 ? ` &times; ${i.quantity}` : ""}
        </td></tr>`
      )
      .join("")

    const trackingBlock = trackingNumber || trackingUrl
      ? `<div style="margin-top:18px;padding:16px;background:#f4f8f8;border-radius:12px;">
           <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};">Tracking</div>
           ${trackingNumber ? `<div style="margin-top:6px;color:${INK};font-size:14px;">${trackingNumber}</div>` : ""}
           ${trackingUrl ? `<div style="margin-top:8px;"><a href="${trackingUrl}" style="display:inline-block;background:${TEAL};color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:999px;padding:9px 18px;">Track your delivery</a></div>` : ""}
         </div>`
      : ""

    const html = `
<!doctype html><html><body style="margin:0;background:#f4f8f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,${DARK},${TEAL});border-radius:20px 20px 0 0;padding:32px 28px;color:#fff;">
      <div style="font-size:22px;font-weight:800;letter-spacing:2px;">AQU<span style="color:${GOLD}">O</span>RA</div>
      <div style="margin-top:14px;font-size:18px;font-weight:700;">Good news, ${name} — your order is on its way.</div>
      <div style="margin-top:6px;color:rgba(255,255,255,.85);font-size:14px;">Order ${ref} has been dispatched.</div>
    </div>
    <div style="background:#fff;border-radius:0 0 20px 20px;padding:28px;border:1px solid #eef2f2;border-top:none;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      ${trackingBlock}
      <div style="margin-top:18px;color:${MUTED};font-size:13px;line-height:1.6;">We'll have it with you across the UAE shortly. Questions? Reply to this email or contact <a href="mailto:hello@aquora.ae" style="color:${TEAL};">hello@aquora.ae</a>.</div>
    </div>
    <div style="text-align:center;color:${MUTED};font-size:12px;padding:18px 0;">Aquora · Pool, Spa &amp; Fountain Equipment · Dubai, UAE</div>
  </div>
</body></html>`

    const ok = await sendEmail({
      to: order.email,
      subject: `Your Aquora order ${ref} has shipped`,
      html,
      replyTo: "hello@aquora.ae",
    })

    if (ok) {
      try {
        const orderService: any = container.resolve("order")
        await orderService.updateOrders([
          { id: order.id, metadata: { ...(order.metadata || {}), shipped_email_sent: true } },
        ])
      } catch {
        // marking is best-effort; the worst case is a duplicate email on a re-emit
      }
    }
  } catch (e) {
    console.warn(`[order-shipped] error: ${(e as Error)?.message || e}`)
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}
