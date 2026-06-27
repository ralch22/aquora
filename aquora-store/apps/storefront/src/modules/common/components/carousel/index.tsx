"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// Horizontal scroll-snap rail with desktop prev/next buttons. Server-rendered cards are
// passed as children; each child should be a fixed-width, shrink-0, snap-start item.
export default function Carousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canL, setCanL] = useState(false)
  const [canR, setCanR] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanL(el.scrollLeft > 8)
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      el.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [update])

  const scroll = (dir: number) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: "smooth" })
  }

  const arrow =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-aquora-ink shadow-[0_8px_24px_-8px_rgba(11,31,36,0.3)] transition-all duration-300 hover:bg-aquora-primary hover:text-white small:flex"

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll to previous items"
        disabled={!canL}
        onClick={() => scroll(-1)}
        className={`${arrow} -left-3 disabled:pointer-events-none disabled:opacity-0`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button
        type="button"
        aria-label="Scroll to next items"
        disabled={!canR}
        onClick={() => scroll(1)}
        className={`${arrow} -right-3 disabled:pointer-events-none disabled:opacity-0`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  )
}
