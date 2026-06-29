"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Carousel from "@modules/common/components/carousel"
import { getRecentlyViewed } from "@lib/aquora/retail-track"

type Card = {
  handle: string
  title: string
  thumbnail?: string | null
  price?: number | null
}

// Instant, client-side "Recently viewed" rail from localStorage (complements the Retail
// Recommendations model, which personalises with some ingestion latency). Optionally excludes
// the product currently being viewed (on a PDP). Renders nothing with fewer than 3 items.
export default function RecentlyViewed({
  exclude,
  eyebrow = "Pick up where you left off",
  title = "Recently viewed",
}: {
  exclude?: string
  eyebrow?: string
  title?: string
}) {
  const [items, setItems] = useState<Card[]>([])

  useEffect(() => {
    const handles = getRecentlyViewed()
      .filter((h) => h && h !== exclude)
      .slice(0, 10)
    if (handles.length < 3) return
    const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    if (!base) return
    fetch(`${base}/store/cards?handles=${encodeURIComponent(handles.join(","))}`, {
      headers: { "x-publishable-api-key": key },
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        const byHandle = new Map((d.products || []).map((p: Card) => [p.handle, p]))
        setItems(handles.map((h) => byHandle.get(h)).filter(Boolean) as Card[])
      })
      .catch(() => {})
  }, [exclude])

  if (items.length < 3) return null

  return (
    <section className="content-container py-14 small:py-20">
      <div className="mb-8">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          {eyebrow}
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink small:text-[2rem]">
          {title}
        </h2>
      </div>
      <Carousel>
        {items.map((p) => (
          <LocalizedClientLink
            key={p.handle}
            href={`/products/${p.handle}`}
            className="group block w-[200px] shrink-0 snap-start small:w-[230px]"
          >
            <div className="relative overflow-hidden rounded-[1.4rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:border-aquora-primary/25">
              <div className="relative aspect-square overflow-hidden rounded-[1.05rem] bg-gradient-to-b from-white to-aquora-surface">
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    className="h-full w-full object-contain p-5 transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="absolute inset-0" />
                )}
              </div>
            </div>
            <div className="px-1 pt-3">
              <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-aquora-ink transition-colors group-hover:text-aquora-primary">
                {p.title}
              </h3>
              {p.price != null && (
                <div className="mt-1 text-sm font-bold text-aquora-ink">
                  AED {Number(p.price).toLocaleString("en-AE")}
                </div>
              )}
            </div>
          </LocalizedClientLink>
        ))}
      </Carousel>
    </section>
  )
}
