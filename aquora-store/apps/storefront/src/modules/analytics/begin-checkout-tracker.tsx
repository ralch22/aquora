"use client"

import { useEffect } from "react"
import { trackBeginCheckout } from "@lib/analytics"
import { updateCart } from "@lib/data/cart"
import { getVisitorId } from "@lib/aquora/retail-track"

type Item = { id: string; name: string; price?: number; quantity?: number }

// Reads the GA client id from the _ga cookie (GA1.1.<client_id>) so the server-side
// Measurement Protocol purchase event can attribute to the same session.
function gaClientId(): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(/_ga=GA\d\.\d\.(\d+\.\d+)/)
  return m ? m[1] : null
}

// Fires GA4 begin_checkout once when the checkout form mounts, and persists the GA
// client id onto the cart metadata for server-side purchase attribution.
export default function BeginCheckoutTracker({
  value,
  items,
}: {
  value?: number
  items?: Item[]
}) {
  useEffect(() => {
    trackBeginCheckout({ value, items })
    // Stamp the GA client id AND the Ask-Aqua / Retail visitor id (aq_vid) onto the cart so
    // both propagate to order.metadata: ga_client_id for server-side GA4 purchase attribution,
    // aq_vid for the assisted-conversion join (order.placed -> last assistant conversation).
    const cid = gaClientId()
    const vid = getVisitorId()
    const metadata: Record<string, string> = {}
    if (cid) metadata.ga_client_id = cid
    if (vid && vid !== "anon") metadata.aq_vid = vid
    if (Object.keys(metadata).length) {
      updateCart({ metadata } as any).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
