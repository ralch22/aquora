"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  getCompare,
  clearCompare,
  removeFromCompare,
  COMPARE_EVENT,
  COMPARE_MAX,
} from "@lib/aquora/compare"

type Card = { handle: string; title: string; thumbnail?: string | null }

// Floating "comparison tray" — slides up from the bottom whenever the shopper has selected one or
// more products to compare. Shows their thumbnails, a Compare CTA (→ /compare), and clear/remove
// controls. Mounted globally in the layout; kept in sync via the compare event + storage event.
// Width is capped so it never sits under the Ask-Aqua bubble (bottom-right).
export default function CompareBar() {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "ae"
  const [handles, setHandles] = useState<string[]>([])
  const [cards, setCards] = useState<Card[]>([])

  // Track the localStorage tray.
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

  // Hydrate thumbnails for the selected handles.
  useEffect(() => {
    if (!handles.length) {
      setCards([])
      return
    }
    const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    if (!base) return
    let alive = true
    fetch(`${base}/store/cards?handles=${encodeURIComponent(key)}`, {
      headers: { "x-publishable-api-key": pk },
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        if (!alive) return
        const byHandle = new Map((d.products || []).map((p: Card) => [p.handle, p]))
        setCards(handles.map((h) => byHandle.get(h)).filter(Boolean) as Card[])
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [key, handles])

  if (!handles.length) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-4 small:pb-6">
      <div className="pointer-events-auto w-full max-w-[min(680px,calc(100vw-5.5rem))] animate-[compareUp_0.5s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="rounded-[1.75rem] border border-black/[0.06] bg-white/85 p-2 shadow-[0_24px_60px_-20px_rgba(11,31,36,0.4)] backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-[1.4rem] bg-white px-3 py-2.5 small:px-4">
            {/* Selected thumbnails */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-aquora-muted small:inline">
                Compare
              </span>
              <ul className="flex items-center gap-2 overflow-x-auto">
                {cards.map((c) => (
                  <li key={c.handle} className="group relative shrink-0">
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border border-black/[0.06] bg-aquora-surface">
                      {c.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.thumbnail} alt={c.title} className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="text-[9px] text-aquora-muted">No image</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCompare(c.handle)}
                      aria-label={`Remove ${c.title} from comparison`}
                      className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full border border-black/10 bg-white text-aquora-ink shadow-sm transition hover:bg-aquora-ink hover:text-white"
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                        <path d="M3 3l6 6M9 3l-6 6" />
                      </svg>
                    </button>
                  </li>
                ))}
                {/* Empty slots hint */}
                {Array.from({ length: Math.max(0, COMPARE_MAX - cards.length) }).map((_, i) => (
                  <li
                    key={`slot-${i}`}
                    className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl border border-dashed border-black/10 text-aquora-muted/50 small:grid"
                    aria-hidden
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => clearCompare()}
                className="hidden rounded-full px-3 py-2 text-xs font-medium text-aquora-muted transition hover:text-aquora-ink small:inline"
              >
                Clear
              </button>
              <LocalizedClientLink
                href="/compare"
                className="group inline-flex items-center gap-2 rounded-full bg-aquora-primary py-2.5 pl-4 pr-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
              >
                Compare
                <span className="text-[11px] font-bold text-white/70">{cards.length}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                  </svg>
                </span>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes compareUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
