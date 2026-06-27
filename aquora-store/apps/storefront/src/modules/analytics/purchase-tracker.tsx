"use client"

import { useEffect } from "react"
import { trackPurchase } from "@lib/analytics"

type Item = { id: string; name: string; price?: number; quantity?: number }

// Fires GA4 `purchase` once per order (sessionStorage dedupe survives refresh).
export default function PurchaseTracker({
  id,
  value,
  items,
}: {
  id: string
  value?: number
  items?: Item[]
}) {
  useEffect(() => {
    if (typeof window === "undefined") return
    const key = `aq_purchase_${id}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      /* ignore */
    }
    trackPurchase({ id, value, items })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return null
}
