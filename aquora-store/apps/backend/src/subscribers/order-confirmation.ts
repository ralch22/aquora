import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { sendEmail, emailEnabled } from "../lib/email"

// Sends a branded order-confirmation/receipt email when an order is placed. Mirrors the
// env-gated, best-effort pattern of ga-purchase.ts — no-op unless RESEND_API_KEY is set, and
// never blocks the order flow. Amounts are AED major units (e.g. 100 = AED 100.00).
const TEAL = "#0E6E73"
const DARK = "#0A3A42"
const GOLD = "#E0A23B"
const INK = "#0B1F24"
const MUTED = "#6E8C90"

function money(n: any, cur: string): string {
  return `${cur.toUpperCase()} ${Number(n || 0).toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default async function orderConfirmationSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!emailEnabled()) return

  try {
    const orderService = container.resolve(Modules.ORDER)
    const order: any = await orderService.retrieveOrder(event.data.id, {
      relations: ["items", "shipping_address"],
    })

    const email = order.email
    if (!email) return

    const cur = order.currency_code || "aed"
    const ref = order.display_id ? `#${order.display_id}` : order.id
    const sa = order.shipping_address || {}
    const name = [sa.first_name, sa.last_name].filter(Boolean).join(" ") || "there"

    const rows = (order.items || [])
      .map(
        (i: any) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eef2f2;color:${INK};font-size:14px;">
            ${i.product_title || i.title}${i.quantity > 1 ? ` &times; ${i.quantity}` : ""}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eef2f2;color:${INK};font-size:14px;text-align:right;white-space:nowrap;">
            ${money(Number(i.unit_price || 0) * Number(i.quantity || 1), cur)}
          </td>
        </tr>`
      )
      .join("")

    const addr = [sa.address_1, sa.address_2, sa.city, sa.province, sa.postal_code, sa.country_code?.toUpperCase()]
      .filter(Boolean)
      .join(", ")

    const html = `
<!doctype html><html><body style="margin:0;background:#f4f8f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,${DARK},${TEAL});border-radius:20px 20px 0 0;padding:32px 28px;color:#fff;">
      <div style="font-size:22px;font-weight:800;letter-spacing:2px;">AQU<span style="color:${GOLD}">O</span>RA</div>
      <div style="margin-top:14px;font-size:18px;font-weight:700;">Thank you, ${name} — your order is confirmed.</div>
      <div style="margin-top:6px;color:rgba(255,255,255,.8);font-size:14px;">Order ${ref}</div>
    </div>
    <div style="background:#fff;border-radius:0 0 20px 20px;padding:28px;border:1px solid #eef2f2;border-top:none;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 0;color:${MUTED};font-size:14px;">Subtotal</td><td style="padding:6px 0;text-align:right;color:${INK};font-size:14px;">${money(order.item_total ?? order.subtotal, cur)}</td></tr>
        <tr><td style="padding:6px 0;color:${MUTED};font-size:14px;">Delivery</td><td style="padding:6px 0;text-align:right;color:${INK};font-size:14px;">${money(order.shipping_total, cur)}</td></tr>
        <tr><td style="padding:6px 0;color:${MUTED};font-size:14px;">VAT</td><td style="padding:6px 0;text-align:right;color:${INK};font-size:14px;">${money(order.tax_total, cur)}</td></tr>
        <tr><td style="padding:12px 0 0;color:${INK};font-size:16px;font-weight:800;border-top:2px solid ${TEAL};">Total</td><td style="padding:12px 0 0;text-align:right;color:${INK};font-size:16px;font-weight:800;border-top:2px solid ${TEAL};">${money(order.total, cur)}</td></tr>
      </table>
      ${addr ? `<div style="margin-top:22px;padding:16px;background:#f4f8f8;border-radius:12px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:${MUTED};">Delivery to</div><div style="margin-top:6px;color:${INK};font-size:14px;">${addr}</div></div>` : ""}
      <div style="margin-top:18px;color:${MUTED};font-size:13px;line-height:1.6;">We'll dispatch your order across the UAE within 2–4 working days and email you when it ships. Questions? Just reply to this email or contact <a href="mailto:hello@aquora.ae" style="color:${TEAL};">hello@aquora.ae</a>.</div>
    </div>
    <div style="text-align:center;color:${MUTED};font-size:12px;padding:18px 0;">Aquora · Pool, Spa &amp; Fountain Equipment · Dubai, UAE</div>
  </div>
</body></html>`

    await sendEmail({
      to: email,
      subject: `Your Aquora order ${ref} is confirmed`,
      html,
      replyTo: "hello@aquora.ae",
    })
  } catch {
    // best-effort; never block the order flow
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
