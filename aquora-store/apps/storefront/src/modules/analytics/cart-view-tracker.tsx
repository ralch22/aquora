"use client"

import { useEffect, useRef } from "react"
import { trackViewCart } from "@lib/analytics"

type CartItem = { id: string; name: string; price?: number; quantity?: number; category?: string }

// Fires GA4 view_cart once when the cart view renders, with the cart's line items and value.
// Renders nothing and mounts INLINE (never inside a streamed <Suspense>).
export default function CartViewTracker({
  value,
  items,
}: {
  value: number
  items: CartItem[]
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current || !items.length) return
    fired.current = true
    trackViewCart({ value, items })
    // Fire once per cart-view mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
