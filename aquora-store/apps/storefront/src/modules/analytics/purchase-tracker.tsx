"use client"

import { useEffect } from "react"
import { trackPurchase } from "@lib/analytics"
import { trackRetailEvent } from "@lib/aquora/retail-track"

type Item = { id: string; name: string; price?: number; quantity?: number }

// Fires GA4 `purchase` + a Google Retail `purchase-complete` event once per order
// (sessionStorage dedupe survives refresh). The purchase signal is the strongest input to
// Retail's recommendation models.
export default function PurchaseTracker({
  id,
  value,
  items,
  handles,
}: {
  id: string
  value?: number
  items?: Item[]
  handles?: string[]
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
    if (handles?.length) trackRetailEvent("purchase-complete", { productHandles: handles })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return null
}
