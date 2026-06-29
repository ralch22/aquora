"use client"

import { useEffect, useRef, useState } from "react"
import ImageBanner, { ImageBannerProps } from "@modules/common/components/image-banner"

// Homepage hero: a rotating set of image banners composed from real brand photography. Auto-
// advances, pauses on hover/focus, respects reduced motion, and is dot-navigable. Slides are
// stacked and cross-faded so there's no layout shift.
export default function BannerCarousel({
  banners,
  interval = 6000,
}: {
  banners: ImageBannerProps[]
  interval?: number
}) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = banners.length

  useEffect(() => {
    if (n <= 1 || paused) return
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = setInterval(() => setActive((i) => (i + 1) % n), interval)
    return () => clearInterval(t)
  }, [n, paused, interval])

  if (!n) return null

  return (
    <section className="content-container pt-6 small:pt-8">
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        {/* Slides */}
        <div className="relative min-h-[440px] small:min-h-[520px]">
          {banners.map((b, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                i === active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={i !== active}
            >
              <ImageBanner {...b} variant="hero" priority={i === 0} />
            </div>
          ))}
        </div>

        {/* Dots */}
        {n > 1 && (
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 small:left-12 small:translate-x-0">
            {banners.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show banner ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? "w-7 bg-aquora-accent" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
