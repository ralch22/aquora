"use client"

import { useEffect, useRef } from "react"
import { trackSelectItem, trackViewItemList } from "@lib/analytics"
import type { ListItem } from "@lib/aquora/list-items"

// Wraps a product grid/rail and fires GA4 list events without touching the (server-rendered)
// ProductPreview cards:
//  - view_item_list once, when the grid scrolls into view (IntersectionObserver, fire-once).
//  - select_item on click-through, resolved by parsing the clicked /products/<handle> link
//    back to its item via event delegation.
// Renders its children INLINE (a plain wrapper element, never a streamed <Suspense>) so the
// deferred-suspense bug can't hide funnel-critical product grids.
export default function ProductListTracker({
  listName,
  listId,
  items,
  children,
  className,
  as = "div",
}: {
  listName: string
  listId?: string
  items: ListItem[]
  children: React.ReactNode
  className?: string
  as?: "div" | "section"
}) {
  const ref = useRef<HTMLElement>(null)
  const fired = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !items.length || fired.current) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true
            trackViewItemList({ listName, listId, items })
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [items, listName, listId])

  const handleClick = (e: React.MouseEvent) => {
    const anchor = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null
    if (!anchor) return
    const match = (anchor.getAttribute("href") || "").match(/\/products\/([^/?#]+)/)
    if (!match) return
    const handle = decodeURIComponent(match[1])
    const index = items.findIndex((it) => it.handle === handle)
    if (index < 0) return
    trackSelectItem({ listName, listId, item: items[index], index })
  }

  const Tag = as
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Tag>
  )
}
