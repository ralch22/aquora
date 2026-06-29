"use client"

import { useEffect, useRef } from "react"
import { trackViewItemList, trackSelectItem } from "@lib/analytics"

type Item = { id: string; name: string; price?: number }

// Wraps a product grid/rail and fires GA4 view_item_list once when it scrolls into
// view, and select_item when a card is clicked through to a PDP. Click attribution
// is delegated: each ProductPreview root carries data-product-id, so a single
// listener on the wrapper covers every card without per-card client boundaries.
// Renders INLINE (plain block wrapper, no Suspense) per the deferred-suspense invariant.
export default function ProductListTracker({
  listName,
  listId,
  items,
  children,
}: {
  listName: string
  listId?: string
  items: Item[]
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const fired = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !items.length || fired.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !fired.current) {
          fired.current = true
          trackViewItemList({ listName, listId, items })
          io.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [listName, listId, items])

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const node = (e.target as HTMLElement).closest("[data-product-id]")
    const id = node?.getAttribute("data-product-id")
    if (!id) return
    const item = items.find((i) => i.id === id)
    if (item) trackSelectItem({ listName, listId, item })
  }

  return (
    <div ref={ref} onClickCapture={onClickCapture}>
      {children}
    </div>
  )
}
