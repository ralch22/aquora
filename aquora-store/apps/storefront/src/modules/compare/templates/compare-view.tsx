"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCompare, removeFromCompare, clearCompare, COMPARE_EVENT } from "@lib/aquora/compare"
import { addToCart } from "@lib/data/cart"
import { trackAddToCart } from "@lib/analytics"
import { toast } from "@modules/common/components/toast"

type Spec = { name: string; value: string }
type Item = {
  handle: string
  title: string
  category: string | null
  brand: string | null
  variant_id: string | null
  price: number | null
  thumbnail: string | null
  in_stock: boolean
  specs: Spec[]
  features: string[]
}

function aed(n: number | null): string {
  return n == null ? "—" : `AED ${Number(n).toLocaleString("en-AE")}`
}

export default function CompareView() {
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.countryCode as string) || "ae"
  const [handles, setHandles] = useState<string[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [diffOnly, setDiffOnly] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  // Track the tray (so removing a column here updates the rest of the app too).
  useEffect(() => {
    const sync = () => setHandles(getCompare())
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const key = useMemo(() => handles.join(","), [handles])

  useEffect(() => {
    if (!handles.length) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    if (!base) {
      setLoading(false)
      return
    }
    let alive = true
    fetch(`${base}/store/compare?handles=${encodeURIComponent(key)}`, {
      headers: { "x-publishable-api-key": pk },
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        if (!alive) return
        const byHandle = new Map((d.products || []).map((p: Item) => [p.handle, p]))
        setItems(handles.map((h) => byHandle.get(h)).filter(Boolean) as Item[])
        setLoading(false)
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [key, handles])

  // Union of all spec names, preserving first-seen order across products.
  const specNames = useMemo(() => {
    const seen = new Set<string>()
    const order: string[] = []
    for (const it of items) {
      for (const s of it.specs || []) {
        if (!seen.has(s.name)) {
          seen.add(s.name)
          order.push(s.name)
        }
      }
    }
    return order
  }, [items])

  const specMaps = useMemo(
    () => items.map((it) => new Map((it.specs || []).map((s) => [s.name, s.value]))),
    [items]
  )

  // A spec row varies if its defined values aren't all identical.
  const rowVaries = (name: string): boolean => {
    const vals = specMaps.map((m) => m.get(name)).filter((v) => v != null)
    return new Set(vals).size > 1
  }

  const visibleSpecNames = diffOnly ? specNames.filter(rowVaries) : specNames

  const lowestPrice = useMemo(() => {
    const prices = items.map((i) => i.price).filter((p): p is number => p != null)
    return prices.length >= 2 ? Math.min(...prices) : null
  }, [items])

  async function handleAdd(it: Item) {
    if (!it.variant_id) return
    setAdding(it.handle)
    try {
      await addToCart({ variantId: it.variant_id, quantity: 1, countryCode })
      trackAddToCart({ id: it.handle, name: it.title, price: it.price ?? undefined, quantity: 1, category: it.category ?? undefined })
      toast.success("Added to cart", it.title)
      router.refresh()
    } catch {
      toast.error("Couldn't add to cart", "Please try again, or open the product page.")
    } finally {
      setAdding(null)
    }
  }

  // ---- Empty state ----
  if (!loading && !handles.length) {
    return (
      <div className="content-container py-20 small:py-28">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-black/[0.06] bg-white p-10 text-center shadow-[0_24px_60px_-30px_rgba(11,31,36,0.25)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-aquora-surface text-aquora-primary">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M7 4v16M17 4v16" />
              <path d="M3.5 8.5 7 5l3.5 3.5M20.5 15.5 17 19l-3.5-3.5" />
            </svg>
          </div>
          <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight text-aquora-ink">Nothing to compare yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-aquora-muted">
            Add products to your comparison with the compare icon on any product card, then review their specs side by side here.
          </p>
          <LocalizedClientLink
            href="/store"
            className="group mt-7 inline-flex items-center gap-2 rounded-full bg-aquora-primary py-3 pl-6 pr-3 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            Browse products
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
              </svg>
            </span>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="content-container py-16">
        <div className="h-8 w-56 animate-pulse rounded-full bg-aquora-surface" />
        <div className="mt-8 grid grid-cols-2 gap-4 small:grid-cols-4">
          {Array.from({ length: Math.min(4, Math.max(2, handles.length)) }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-[1.4rem] bg-aquora-surface" />
          ))}
        </div>
      </div>
    )
  }

  const gridCols = `minmax(120px,160px) repeat(${items.length}, minmax(180px,1fr))`

  return (
    <div className="content-container py-10 small:py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Side by side
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-4xl">
            Compare products
          </h1>
          <p className="mt-1.5 text-sm text-aquora-muted">
            {items.length} {items.length === 1 ? "product" : "products"} · specs aligned for an easy decision
          </p>
        </div>
        <div className="flex items-center gap-4">
          {specNames.some(rowVaries) && (
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-aquora-ink">
              <span className="text-aquora-muted">Only differences</span>
              <button
                type="button"
                role="switch"
                aria-checked={diffOnly}
                onClick={() => setDiffOnly((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${diffOnly ? "bg-aquora-primary" : "bg-black/15"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${diffOnly ? "translate-x-[1.4rem]" : "translate-x-0.5"}`} />
              </button>
            </label>
          )}
          <button
            type="button"
            onClick={() => clearCompare()}
            className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-aquora-muted transition hover:border-black/20 hover:text-aquora-ink"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Comparison grid */}
      <div className="mt-8 overflow-x-auto rounded-[1.5rem] border border-black/[0.06] bg-white shadow-[0_24px_60px_-34px_rgba(11,31,36,0.3)]">
        <div className="min-w-max">
          {/* Product header row */}
          <div className="grid items-stretch" style={{ gridTemplateColumns: gridCols }}>
            <div className="sticky left-0 z-10 border-b border-r border-black/[0.06] bg-white" />
            {items.map((it) => (
              <div key={it.handle} className="relative border-b border-l border-black/[0.06] p-4">
                <button
                  type="button"
                  onClick={() => removeFromCompare(it.handle)}
                  aria-label={`Remove ${it.title}`}
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full border border-black/10 bg-white text-aquora-muted shadow-sm transition hover:bg-aquora-ink hover:text-white"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
                <LocalizedClientLink href={`/products/${it.handle}`} className="group block">
                  <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-[1.1rem] bg-gradient-to-b from-white to-aquora-surface">
                    {it.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.thumbnail} alt={it.title} className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.05]" />
                    ) : (
                      <div className="absolute inset-0" />
                    )}
                  </div>
                  {it.brand && (
                    <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-aquora-primary">{it.brand}</div>
                  )}
                  <h2 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-aquora-ink transition-colors group-hover:text-aquora-primary">
                    {it.title}
                  </h2>
                </LocalizedClientLink>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-base font-bold text-aquora-ink">{aed(it.price)}</span>
                  {lowestPrice != null && it.price === lowestPrice && (
                    <span className="rounded-full bg-aquora-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aquora-accentdark">
                      Best price
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={!it.variant_id || adding === it.handle}
                  onClick={() => handleAdd(it)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-aquora-primary px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding === it.handle ? "Adding…" : "Add to cart"}
                </button>
              </div>
            ))}
          </div>

          {/* Attribute rows */}
          <CompareRows
            label="Price"
            values={items.map((it) => aed(it.price))}
            gridCols={gridCols}
            strong
          />
          <CompareRows
            label="Brand"
            values={items.map((it) => it.brand || "—")}
            gridCols={gridCols}
          />
          <CompareRows
            label="Category"
            values={items.map((it) => it.category || "—")}
            gridCols={gridCols}
          />

          {visibleSpecNames.map((name, idx) => (
            <CompareRows
              key={name}
              label={name}
              values={specMaps.map((m) => m.get(name) || "—")}
              gridCols={gridCols}
              zebra={idx % 2 === 0}
              highlight={diffOnly}
            />
          ))}

          {diffOnly && visibleSpecNames.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-aquora-muted">
              These products share the same listed specifications.
            </div>
          )}

          {/* Key features row */}
          {items.some((it) => it.features?.length) && (
            <div className="grid border-t border-black/[0.06]" style={{ gridTemplateColumns: gridCols }}>
              <div className="sticky left-0 z-10 border-r border-black/[0.06] bg-white px-5 py-4 text-sm font-semibold text-aquora-muted">
                Highlights
              </div>
              {items.map((it) => (
                <div key={it.handle} className="border-l border-black/[0.06] px-4 py-4">
                  {it.features?.length ? (
                    <ul className="space-y-1.5">
                      {it.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-aquora-ink">
                          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aquora-accentdark" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M3 8.5l3 3 7-7.5" />
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-aquora-muted">—</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-aquora-muted">
        Specifications are sourced from manufacturer data. Need help choosing? Ask Aqua, our AI advisor, bottom-right.
      </p>
    </div>
  )
}

function CompareRows({
  label,
  values,
  gridCols,
  zebra = false,
  strong = false,
  highlight = false,
}: {
  label: string
  values: string[]
  gridCols: string
  zebra?: boolean
  strong?: boolean
  highlight?: boolean
}) {
  const distinct = new Set(values.filter((v) => v && v !== "—"))
  const varies = distinct.size > 1
  return (
    <div className={`grid border-t border-black/[0.06] ${zebra ? "bg-aquora-surface/40" : ""}`} style={{ gridTemplateColumns: gridCols }}>
      <div className={`sticky left-0 z-10 border-r border-black/[0.06] px-5 py-3 text-sm font-medium text-aquora-muted ${zebra ? "bg-[#f6faf9]" : "bg-white"}`}>
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={`border-l border-black/[0.06] px-4 py-3 text-sm ${strong ? "font-bold text-aquora-ink" : "text-aquora-ink"} ${
            highlight && varies && v !== "—" ? "bg-aquora-accent/[0.08]" : ""
          }`}
        >
          {v}
        </div>
      ))}
    </div>
  )
}
