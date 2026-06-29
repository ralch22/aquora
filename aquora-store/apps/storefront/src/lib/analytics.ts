// Analytics layer for both GTM (dataLayer) and direct GA4 (gtag). Each event is
// pushed to the GTM ecommerce dataLayer AND sent via gtag — whichever tag is loaded
// consumes it (they are mutually exclusive in ga-script, so no double-counting).
// All no-op on the server / when neither tag is present. IDs only — never PII.
type Params = Record<string, unknown>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

type Item = { id: string; name: string; price?: number; quantity?: number; category?: string }
const toItem = (i: Item) => ({
  item_id: i.id,
  item_name: i.name,
  ...(i.category ? { item_category: i.category } : {}),
  ...(i.price != null ? { price: Number(i.price) } : {}),
  ...(i.quantity != null ? { quantity: Number(i.quantity) } : {}),
})

// Queue an event into the dataLayer in BOTH formats so it survives early (pre-tag-load)
// firing: the GTM ecommerce object (consumed by GTM) and the gtag arguments command
// (replayed by GA4's gtag.js when it loads). Only one tag loads, so no double-count.
function emit(event: string, ecommerce?: Params, extra?: Params) {
  if (typeof window === "undefined") return
  const dl = (window.dataLayer = window.dataLayer || [])
  const params = { ...(ecommerce || {}), ...(extra || {}) }
  // GTM ecommerce event
  dl.push({ ecommerce: null }) // clear the previous ecommerce object
  dl.push({ event, ...(ecommerce ? { ecommerce } : {}), ...(extra || {}) })
  // GA4 gtag-format command (queues until gtag.js loads, then GA4 processes it)
  ;(dl as unknown[]).push(["event", event, params])
}

export function track(event: string, params?: Params) {
  emit(event, undefined, params)
}

export function trackViewItem(i: Item) {
  emit("view_item", { currency: "AED", value: Number(i.price ?? 0), items: [toItem(i)] })
}

export function trackAddToCart(i: Item) {
  emit("add_to_cart", {
    currency: "AED",
    value: Number(i.price ?? 0) * Number(i.quantity ?? 1),
    items: [toItem({ ...i, quantity: i.quantity ?? 1 })],
  })
}

export function trackBeginCheckout(p: { value?: number; items?: Item[] }) {
  emit("begin_checkout", { currency: "AED", value: Number(p.value ?? 0), items: (p.items || []).map(toItem) })
}

export function trackAddPaymentInfo(p: { value?: number; paymentType?: string }) {
  emit("add_payment_info", {
    currency: "AED",
    value: Number(p.value ?? 0),
    ...(p.paymentType ? { payment_type: p.paymentType } : {}),
  })
}

export function trackPurchase(p: { id: string; value?: number; items?: Item[] }) {
  emit("purchase", {
    transaction_id: p.id,
    currency: "AED",
    value: Number(p.value ?? 0),
    items: (p.items || []).map(toItem),
  })
}

// A/B harness impression: report which variant the visitor was bucketed into so GA4 can
// segment any downstream conversion (add_to_cart, purchase, …) by variant. Sent both as a
// discrete event AND as a GA4 user_property, so it can be used as an Exploration dimension
// or audience condition without joining on the event.
export function trackExperiment(experimentId: string, variantId: string) {
  if (typeof window === "undefined") return
  emit("experiment_impression", undefined, { experiment_id: experimentId, variant_id: variantId })
  const dl = (window.dataLayer = window.dataLayer || [])
  ;(dl as unknown[]).push(["set", "user_properties", { [`exp_${experimentId}`]: variantId }])
}
