// Phase 2 — client-side Google Retail personalization signals: a stable visitor id (shared
// with Ask Aqua), fire-and-forget user-event ingestion (→ /store/event → Retail), and a
// locally-stored "recently viewed" list. All no-ops on the server / on any failure.

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const VID_KEY = "aq_vid"
const RECENT_KEY = "aq_recent"

export function getVisitorId(): string {
  if (typeof window === "undefined") return "anon"
  try {
    let v = localStorage.getItem(VID_KEY)
    if (!v) {
      v = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(VID_KEY, v)
    }
    return v
  } catch {
    return "anon"
  }
}

export type RetailEvent =
  | "home-page-view"
  | "detail-page-view"
  | "add-to-cart"
  | "purchase-complete"
  | "search"

export function trackRetailEvent(
  eventType: RetailEvent,
  opts: { productHandles?: string[]; searchQuery?: string } = {}
): void {
  if (typeof window === "undefined" || !BACKEND) return
  try {
    fetch(`${BACKEND}/store/event`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-publishable-api-key": KEY },
      body: JSON.stringify({ eventType, visitorId: getVisitorId(), ...opts }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

export function recordRecentlyViewed(handle: string): void {
  if (typeof window === "undefined" || !handle) return
  try {
    const cur = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[]
    const next = [handle, ...cur.filter((h) => h !== handle)].slice(0, 12)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[]
  } catch {
    return []
  }
}
