"use client"

import { useEffect } from "react"
import { trackBeginCheckout } from "@lib/analytics"

type Item = { id: string; name: string; price?: number; quantity?: number }

// Fires GA4 begin_checkout once when the checkout form mounts.
export default function BeginCheckoutTracker({
  value,
  items,
}: {
  value?: number
  items?: Item[]
}) {
  useEffect(() => {
    trackBeginCheckout({ value, items })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
