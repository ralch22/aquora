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

// list_name/list_id describe the surface a product appeared in (e.g. "search",
// "category:<handle>", "related", "featured"). They are echoed onto each item so
// GA4 can attribute select_item clicks back to the originating list.
type List = { listName: string; listId?: string }
const listParams = (l: List) => ({
  item_list_name: l.listName,
  ...(l.listId ? { item_list_id: l.listId } : {}),
})

export function trackViewItemList(p: List & { items: Item[] }) {
  if (!p.items.length) return
  emit("view_item_list", {
    ...listParams(p),
    items: p.items.map((i) => ({ ...toItem(i), ...listParams(p) })),
  })
}

export function trackSelectItem(p: List & { item: Item }) {
  emit("select_item", {
    ...listParams(p),
    items: [{ ...toItem(p.item), ...listParams(p) }],
  })
}

export function trackSearch(searchTerm: string) {
  if (!searchTerm) return
  emit("search", undefined, { search_term: searchTerm })
}

export function trackViewCart(p: { value?: number; items?: Item[] }) {
  emit("view_cart", {
    currency: "AED",
    value: Number(p.value ?? 0),
    items: (p.items || []).map(toItem),
  })
}

export function trackRemoveFromCart(i: Item) {
  emit("remove_from_cart", {
    currency: "AED",
    value: Number(i.price ?? 0) * Number(i.quantity ?? 1),
    items: [toItem({ ...i, quantity: i.quantity ?? 1 })],
  })
}
