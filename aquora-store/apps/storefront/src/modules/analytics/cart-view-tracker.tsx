"use client"

import { useEffect } from "react"
import { trackViewCart } from "@lib/analytics"

type Item = { id: string; name: string; price?: number; quantity?: number }

// Fires GA4 view_cart once when the cart page renders, with the current line items
// and cart total. Renders nothing; mounted INLINE (no streamed Suspense).
export default function CartViewTracker({
  value,
  items,
}: {
  value?: number
  items?: Item[]
}) {
  useEffect(() => {
    trackViewCart({ value, items })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
