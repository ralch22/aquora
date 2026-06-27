// Env-gated GA4 analytics. Every call is a no-op on the server and when
// NEXT_PUBLIC_GA_ID is unset (window.gtag undefined). IDs only — never PII.
type Params = Record<string, unknown>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export function track(event: string, params?: Params) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", event, params || {})
}

const money = (value?: number) => ({ currency: "AED", value: Number(value ?? 0) })

type Item = { id: string; name: string; price?: number; quantity?: number; category?: string }
const toGaItem = (i: Item) => ({
  item_id: i.id,
  item_name: i.name,
  ...(i.category ? { item_category: i.category } : {}),
  ...(i.price != null ? { price: i.price } : {}),
  ...(i.quantity != null ? { quantity: i.quantity } : {}),
})

export function trackViewItem(i: Item) {
  track("view_item", { ...money(i.price), items: [toGaItem(i)] })
}

export function trackAddToCart(i: Item) {
  track("add_to_cart", {
    ...money((i.price ?? 0) * (i.quantity ?? 1)),
    items: [toGaItem({ ...i, quantity: i.quantity ?? 1 })],
  })
}

export function trackBeginCheckout(p: { value?: number; items?: Item[] }) {
  track("begin_checkout", { ...money(p.value), items: (p.items || []).map(toGaItem) })
}

export function trackAddPaymentInfo(p: { value?: number; paymentType?: string }) {
  track("add_payment_info", { ...money(p.value), ...(p.paymentType ? { payment_type: p.paymentType } : {}) })
}

export function trackPurchase(p: { id: string; value?: number; items?: Item[] }) {
  track("purchase", { transaction_id: p.id, ...money(p.value), items: (p.items || []).map(toGaItem) })
}
