import { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail, emailEnabled } from "../lib/email"

// Daily post-purchase review-request engine. A few days after an order is placed (enough time for
// delivery + first use), email the customer asking them to review what they bought — linking each
// product to its PDP review form, where adding the order number unlocks a Verified Purchase badge.
// Idempotent: each order is marked `metadata.review_request_sent` so it's only ever emailed once.
// No-op unless RESEND_API_KEY is set. This is the engine that fills the (honestly empty) reviews.

const TEAL = "#0E6E73"
const DARK = "#0A3A42"
const GOLD = "#E0A23B"
const INK = "#0B1F24"
const MUTED = "#6E8C90"

const DELAY_DAYS = 4 // wait this long after purchase before asking
const WINDOW_DAYS = 45 // don't chase orders older than this
const BATCH = 40 // cap emails per run

export default async function reviewRequestJob(container: MedusaContainer) {
  if (!emailEnabled()) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const orderService: any = container.resolve(Modules.ORDER)
    const query: any = container.resolve(ContainerRegistrationKeys.QUERY)

    const now = Date.now()
    const until = new Date(now - DELAY_DAYS * 86400_000)
    const since = new Date(now - WINDOW_DAYS * 86400_000)

    const orders: any[] = await orderService.listOrders(
      { created_at: { $gte: since, $lte: until } },
      { relations: ["items"], take: 300, order: { created_at: "DESC" } }
    )

    const pending = orders
      .filter((o) => o?.email && !(o.metadata && o.metadata.review_request_sent))
      .slice(0, BATCH)

    if (!pending.length) return

    const base = (process.env.STOREFRONT_URL || "https://aquora.ae").replace(/\/+$/, "")
    let sent = 0

    for (const order of pending) {
      try {
        const items = order.items || []
        const ids = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))]
        // Resolve handles + thumbnails for the purchased products.
        let products: any[] = []
        if (ids.length) {
          const { data } = await query.graph({
            entity: "product",
            fields: ["id", "handle", "title", "thumbnail"],
            filters: { id: ids } as any,
            pagination: { take: ids.length },
          })
          products = data || []
        }
        const byId = new Map(products.map((p) => [p.id, p]))

        const ref = order.display_id ? `#${order.display_id}` : order.id
        const sa = order.shipping_address || {}
        const name = [sa.first_name, sa.last_name].filter(Boolean).join(" ") || "there"

        const cards = items
          .map((i: any) => {
            const p = byId.get(i.product_id)
            if (!p?.handle) return ""
            const url = `${base}/ae/products/${p.handle}#reviews`
            const img = p.thumbnail || ""
            return `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eef2f2;vertical-align:middle;">
                <table><tr>
                  ${img ? `<td style="width:56px;"><img src="${img}" width="48" height="48" style="border-radius:10px;object-fit:contain;background:#f4f8f8;" alt=""/></td>` : ""}
                  <td style="color:${INK};font-size:14px;padding-left:6px;">${p.title || i.product_title || i.title}</td>
                  <td style="text-align:right;white-space:nowrap;">
                    <a href="${url}" style="display:inline-block;background:${TEAL};color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:999px;padding:8px 16px;">Write a review</a>
                  </td>
                </tr></table>
              </td>
            </tr>`
          })
          .filter(Boolean)
          .join("")

        if (!cards) continue

        const html = `
<!doctype html><html><body style="margin:0;background:#f4f8f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,${DARK},${TEAL});border-radius:20px 20px 0 0;padding:32px 28px;color:#fff;">
      <div style="font-size:22px;font-weight:800;letter-spacing:2px;">AQU<span style="color:${GOLD}">O</span>RA</div>
      <div style="margin-top:14px;font-size:18px;font-weight:700;">How are you getting on, ${name}?</div>
      <div style="margin-top:6px;color:rgba(255,255,255,.85);font-size:14px;">Your order ${ref} should be set up by now — we'd love your honest take.</div>
    </div>
    <div style="background:#fff;border-radius:0 0 20px 20px;padding:24px 28px;border:1px solid #eef2f2;border-top:none;">
      <p style="margin:0 0 14px;color:${MUTED};font-size:14px;line-height:1.6;">Your review helps other UAE pool owners choose with confidence. It takes a minute, and adding your order number (${ref.replace('#','')}) earns a <strong style="color:${TEAL};">Verified Purchase</strong> badge.</p>
      <table style="width:100%;border-collapse:collapse;">${cards}</table>
      <p style="margin:18px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">Something not right? Just reply to this email or contact <a href="mailto:hello@aquora.ae" style="color:${TEAL};">hello@aquora.ae</a> and we'll make it right.</p>
    </div>
    <div style="text-align:center;color:${MUTED};font-size:12px;padding:18px 0;">Aquora · Pool, Spa &amp; Fountain Equipment · Dubai, UAE</div>
  </div>
</body></html>`

        const ok = await sendEmail({
          to: order.email,
          subject: `How's your Aquora order ${ref}? Share a quick review`,
          html,
          replyTo: "hello@aquora.ae",
        })

        // Mark as sent regardless of transient send result? Only on success, so a failed send
        // retries next run; but cap retries by the WINDOW_DAYS horizon.
        if (ok) {
          await orderService.updateOrders([
            { id: order.id, metadata: { ...(order.metadata || {}), review_request_sent: true, review_request_at: new Date().toISOString() } },
          ])
          sent++
        }
      } catch (e) {
        logger?.warn?.(`[review-request] order ${order?.id} failed: ${(e as Error)?.message || e}`)
      }
    }

    if (sent) logger?.info?.(`[review-request] sent ${sent} review-request email(s)`)
  } catch (e) {
    logger?.warn?.(`[review-request] job error: ${(e as Error)?.message || e}`)
  }
}

export const config = {
  name: "review-request",
  // Daily at 09:00 server time.
  schedule: "0 9 * * *",
}
