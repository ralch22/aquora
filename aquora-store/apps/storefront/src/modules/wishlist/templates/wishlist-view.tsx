"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PremiumCta from "@modules/common/components/premium-cta"
import { addToCart } from "@lib/data/cart"
import { trackAddToCart } from "@lib/analytics"
import { trackRetailEvent } from "@lib/aquora/retail-track"
import { toast } from "@modules/common/components/toast"
import { getWishlist, removeFromWishlist, WISHLIST_EVENT } from "@lib/aquora/wishlist"

type Card = {
  handle: string
  title: string
  thumbnail?: string | null
  price?: number | null
  category?: string | null
  brand?: string | null
  variant_id?: string | null
  in_stock?: boolean
}

export default function WishlistView() {
  const params = useParams()
  const countryCode = typeof params?.countryCode === "string" ? params.countryCode : "ae"
  const [items, setItems] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)

  const load = useCallback(async () => {
    const handles = getWishlist()
    if (!handles.length) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
      const r = await fetch(`${base}/store/cards?handles=${encodeURIComponent(handles.join(","))}`, {
        headers: { "x-publishable-api-key": key },
      })
      const d = r.ok ? await r.json() : { products: [] }
      const byHandle = new Map((d.products || []).map((p: Card) => [p.handle, p]))
      setItems(handles.map((h) => byHandle.get(h)).filter(Boolean) as Card[])
    } catch {
      setItems([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const onChange = () => load()
    window.addEventListener(WISHLIST_EVENT, onChange)
    return () => window.removeEventListener(WISHLIST_EVENT, onChange)
  }, [load])

  const remove = (h: string) => {
    removeFromWishlist(h)
    setItems((prev) => prev.filter((x) => x.handle !== h))
  }

  const add = async (c: Card) => {
    if (!c.variant_id || adding) return
    setAdding(c.handle)
    try {
      await addToCart({ variantId: c.variant_id, quantity: 1, countryCode })
      trackAddToCart({ id: c.variant_id, name: c.title, price: c.price ?? undefined, quantity: 1, category: c.category ?? undefined })
      trackRetailEvent("add-to-cart", { productHandles: [c.handle] })
      toast.success("Added to cart", c.title)
    } catch {
      toast.error("Couldn't add to cart", "Please try again, or open the product page.")
    } finally {
      setAdding(null)
    }
  }

  if (loading) {
    return <div className="content-container py-24 text-center text-aquora-muted">Loading your saved items…</div>
  }

  if (!items.length) {
    return (
      <div className="content-container flex flex-col items-center justify-center px-4 py-24 text-center small:py-32">
        <div className="mb-8 grid h-24 w-24 place-items-center rounded-[1.75rem] border border-black/[0.06] bg-white shadow-[0_22px_44px_-26px_rgba(11,31,36,0.28)]">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-aquora-surface text-aquora-accent">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Your wishlist
        </span>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-4xl">
          Nothing saved yet
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-aquora-muted">
          Tap the heart on any product to save it here — build a shortlist of pumps, filters
          or heating before you decide.
        </p>
        <div className="mt-8">
          <PremiumCta href="/store" variant="primary">
            Browse the catalogue
          </PremiumCta>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-12 small:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Your wishlist
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink small:text-[2rem]">
            {items.length} saved {items.length === 1 ? "item" : "items"}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 small:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => (
          <div key={c.handle} className="group flex flex-col">
            <div className="relative overflow-hidden rounded-[1.4rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:border-aquora-primary/25">
              <button
                type="button"
                aria-label={`Remove ${c.title} from wishlist`}
                onClick={() => remove(c.handle)}
                className="absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/[0.06] bg-white/90 text-aquora-ink shadow-sm backdrop-blur transition hover:text-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-aquora-accent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
              <LocalizedClientLink href={`/products/${c.handle}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-[1.05rem] bg-gradient-to-b from-white to-aquora-surface">
                  {c.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail} alt={c.title} className="h-full w-full object-contain p-5 transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]" />
                  ) : (
                    <div className="absolute inset-0" />
                  )}
                </div>
              </LocalizedClientLink>
            </div>
            <div className="px-1 pt-3">
              <LocalizedClientLink href={`/products/${c.handle}`}>
                <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-aquora-ink transition-colors hover:text-aquora-primary">
                  {c.title}
                </h3>
              </LocalizedClientLink>
              {c.price != null && (
                <div className="mt-1 text-sm font-bold text-aquora-ink">
                  AED {Number(c.price).toLocaleString("en-AE")}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => add(c)}
                  disabled={!c.variant_id || adding === c.handle}
                  className="flex-1 rounded-full bg-aquora-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-aquora-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding === c.handle ? "Adding…" : "Add to cart"}
                </button>
                <LocalizedClientLink
                  href={`/products/${c.handle}`}
                  className="rounded-full border border-aquora-muted/40 px-3 py-1.5 text-xs font-semibold text-aquora-ink transition hover:border-aquora-primary hover:text-aquora-primary"
                >
                  View
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
