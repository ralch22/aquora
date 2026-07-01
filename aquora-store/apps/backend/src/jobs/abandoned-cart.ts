import { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail, emailEnabled } from "../lib/email"

// Abandoned-cart recovery engine. Once an hour, find carts that have items + a customer email,
// were never completed, and have sat untouched for a short window — then send ONE branded
// "you left something behind" email linking back to the cart, itemising what's in it.
// Idempotent: each cart is marked `metadata.recovery_emailed` so it's only ever emailed once.
// No-op unless RESEND_API_KEY is set (mirrors the review-request engine), so it ships safely
// before the owner provisions email.

const TEAL = "#0E6E73"
const DARK = "#0A3A42"
const GOLD = "#E0A23B"
const INK = "#0B1F24"
const MUTED = "#6E8C90"

const STALE_HOURS = 1 // wait this long after the last cart edit before nudging
const WINDOW_HOURS = 72 // don't chase carts older than this (stale, likely lost)
const BATCH = 40 // cap emails per run

function money(n: unknown): string {
  const v = Number(n)
  return Number.isFinite(v) ? `AED ${v.toFixed(2)}` : ""
}

export default async function abandonedCartJob(container: MedusaContainer) {
  if (!emailEnabled()) return

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const cartService: any = container.resolve(Modules.CART)

    const now = Date.now()
    const cutoff = new Date(now - STALE_HOURS * 3600_000) // untouched since at least here
    const floor = new Date(now - WINDOW_HOURS * 3600_000) // but not older than here

    const carts: any[] = await cartService.listCarts(
      { completed_at: { $exists: false }, updated_at: { $lt: cutoff, $gte: floor } },
      { relations: ["items", "shipping_address"], take: 300, order: { updated_at: "DESC" } }
    )

    // email / items / idempotency aren't expressible as list filters — enforce in JS.
    const pending = carts
      .filter(
        (c) =>
          c?.email &&
          !c.completed_at &&
          (c.items || []).length > 0 &&
          !(c.metadata && c.metadata.recovery_emailed)
      )
      .slice(0, BATCH)

    if (!pending.length) return

    const base = (process.env.STOREFRONT_URL || "https://aquora.ae").replace(/\/+$/, "")
    const resumeUrl = `${base}/ae/cart`
    let sent = 0

    for (const cart of pending) {
      try {
        const items = cart.items || []
        const sa = cart.shipping_address || {}
        const name = [sa.first_name, sa.last_name].filter(Boolean).join(" ") || "there"

        const rows = items
          .map((i: any) => {
            const title = i.product_title || i.title || "Item"
            const img = i.thumbnail || ""
            const qty = Number(i.quantity) || 1
            const line = money(i.unit_price)
            return `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #eef2f2;vertical-align:middle;">
                <table style="width:100%;"><tr>
                  ${img ? `<td style="width:56px;"><img src="${img}" width="48" height="48" style="border-radius:10px;object-fit:contain;background:#f4f8f8;" alt=""/></td>` : ""}
                  <td style="color:${INK};font-size:14px;padding-left:6px;">
                    ${title}
                    <div style="color:${MUTED};font-size:12px;margin-top:2px;">Qty ${qty}${line ? ` · ${line}` : ""}</div>
                  </td>
                </tr></table>
              </td>
            </tr>`
          })
          .join("")

        if (!rows) continue

        const html = `
<!doctype html><html><body style="margin:0;background:#f4f8f8;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:linear-gradient(135deg,${DARK},${TEAL});border-radius:20px 20px 0 0;padding:32px 28px;color:#fff;">
      <div style="font-size:22px;font-weight:800;letter-spacing:2px;">AQU<span style="color:${GOLD}">O</span>RA</div>
      <div style="margin-top:14px;font-size:18px;font-weight:700;">You left something in your cart, ${name}</div>
      <div style="margin-top:6px;color:rgba(255,255,255,.85);font-size:14px;">Your selection is saved — pick up right where you left off.</div>
    </div>
    <div style="background:#fff;border-radius:0 0 20px 20px;padding:24px 28px;border:1px solid #eef2f2;border-top:none;">
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <div style="text-align:center;margin:24px 0 6px;">
        <a href="${resumeUrl}" style="display:inline-block;background:${TEAL};color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:999px;padding:14px 34px;">Complete your order</a>
      </div>
      <p style="margin:16px 0 0;color:${MUTED};font-size:13px;line-height:1.6;">Questions about specs, sizing or delivery? Just reply to this email or contact <a href="mailto:hello@aquora.ae" style="color:${TEAL};">hello@aquora.ae</a> — our technical team is happy to help.</p>
    </div>
    <div style="text-align:center;color:${MUTED};font-size:12px;padding:18px 0;">Aquora · Pool, Spa &amp; Fountain Equipment · Dubai, UAE</div>
  </div>
</body></html>`

        const ok = await sendEmail({
          to: cart.email,
          subject: "You left something in your cart",
          html,
          replyTo: "hello@aquora.ae",
        })

        // Mark only on a successful send, so a transient failure retries next run (bounded by
        // the WINDOW_HOURS horizon — an old cart eventually drops out of the query entirely).
        if (ok) {
          await cartService.updateCarts([
            {
              id: cart.id,
              metadata: {
                ...(cart.metadata || {}),
                recovery_emailed: true,
                recovery_emailed_at: new Date().toISOString(),
              },
            },
          ])
          sent++
        }
      } catch (e) {
        logger?.warn?.(`[abandoned-cart] cart ${cart?.id} failed: ${(e as Error)?.message || e}`)
      }
    }

    if (sent) logger?.info?.(`[abandoned-cart] sent ${sent} recovery email(s)`)
  } catch (e) {
    logger?.warn?.(`[abandoned-cart] job error: ${(e as Error)?.message || e}`)
  }
}

export const config = {
  name: "abandoned-cart",
  // Hourly, on the hour — matches the 1-hour "stale" window.
  schedule: "0 * * * *",
}
