"use client"

import { useEffect } from "react"
import { trackBeginCheckout } from "@lib/analytics"
import { updateCart } from "@lib/data/cart"

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
    const cid = gaClientId()
    if (cid) {
      updateCart({ metadata: { ga_client_id: cid } } as any).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
