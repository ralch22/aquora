"use client"

import { useState } from "react"

type Video = { youtube?: string; title?: string }

// Lightweight YouTube facade: shows the poster + a play button, and only loads the (cookie-
// less) iframe on click — so the PDP stays fast and privacy-friendly. Renders nothing
// without a valid id. Fed from product.metadata.video (set by import-videos.ts).
export default function ProductVideo({ video }: { video?: Video | null }) {
  const [play, setPlay] = useState(false)
  const id = video?.youtube
  if (!id) return null

  const title = video?.title || "Product video"
  const poster = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  return (
    <section className="content-container border-t border-black/[0.06] py-14 small:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Watch
        </p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink small:text-[1.9rem]">
          See it in action
        </h2>
        <p className="mt-2 text-aquora-muted">{title}</p>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-aquora-secondary">
          <div className="relative aspect-video">
            {play ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
                title={title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlay(true)}
                aria-label={`Play video: ${title}`}
                className="group absolute inset-0 block h-full w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-aquora-secondary/60 to-aquora-secondary/10 transition-colors group-hover:from-aquora-secondary/50" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-aquora-primary shadow-[0_12px_30px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
