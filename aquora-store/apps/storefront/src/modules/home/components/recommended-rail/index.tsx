"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Carousel from "@modules/common/components/carousel"
import { getVisitorId, trackRetailEvent } from "@lib/aquora/retail-track"

type Rec = {
  handle: string
  title: string
  thumbnail?: string | null
  price?: number | null
  category?: string | null
}

// Phase 2 personalization surface. Pulls from /store/recommend, which serves Google Retail
// Recommendations (Predict) once a model is provisioned + trained, and an honest content
// heuristic (popular flagship categories / complementary) until then. Passing the shared
// visitor id means it personalises automatically the moment the rec model is live. Renders
// nothing if there are no results.
export default function RecommendedRail({
  eyebrow = "For you",
  title = "Recommended for you",
  handle,
  surface,
}: {
  eyebrow?: string
  title?: string
  handle?: string
  surface?: string
}) {
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : "ae"
  const [items, setItems] = useState<Rec[]>([])

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    if (!base) return
    if (!handle) trackRetailEvent("home-page-view")
    const url = `${base}/store/recommend?v=${encodeURIComponent(getVisitorId())}${
      handle ? `&handle=${encodeURIComponent(handle)}` : ""
    }${surface ? `&surface=${encodeURIComponent(surface)}` : ""}`
    fetch(url, { headers: { "x-publishable-api-key": key } })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setItems(Array.isArray(d.products) ? d.products.slice(0, 10) : []))
      .catch(() => {})
  }, [handle, surface])

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
