"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useEffect, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
}

// Thumbnail-strip gallery: a large double-bezel main image (object-contain so
// equipment is never cropped) with a crossfade, a clickable thumbnail row, arrow
// nav + counter, and a click-to-zoom lightbox (equipment buyers need to read
// nameplates/spec detail). Falls back gracefully to a single image.
const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const valid = (images || []).filter((i) => !!i.url)
  const [selected, setSelected] = useState(0)
  const [zoom, setZoom] = useState(false)
  const multi = valid.length > 1
  const label = title || "Product"

  // Clamp so a variant switch (fewer images) can never blank the main image.
  const active = Math.min(selected, valid.length - 1)
  const go = (dir: number) =>
    setSelected((a) => (Math.min(a, valid.length - 1) + dir + valid.length) % valid.length)

  // Lightbox keyboard control + body scroll lock.
  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false)
      else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "ArrowRight") go(1)
    }
    document.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [zoom])

  if (!valid.length) return null

  return (
    <div className="flex flex-col gap-4 small:mx-4 lg:mx-8">
      {/* Main image — double-bezel */}
      <div className="rounded-[1.7rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setZoom(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setZoom(true)
            }
          }}
          aria-label={`Zoom in on ${label}`}
          className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[1.3rem] bg-gradient-to-b from-white to-aquora-surface"
        >
          {valid.map((image, index) => (
            <Image
              key={image.id || index}
              src={image.url as string}
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              className={`object-contain p-7 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                index === active ? "opacity-100" : "opacity-0"
              }`}
              alt={`${label} — view ${index + 1} of ${valid.length}`}
              fill
              sizes="(max-width: 992px) 92vw, 640px"
            />
          ))}

          {/* Zoom affordance */}
          <span className="pointer-events-none absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-aquora-ink opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100 small:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3M11 8v6M8 11h6" />
            </svg>
          </span>

          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/85 text-aquora-ink opacity-0 shadow-sm backdrop-blur transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-0.5 hover:bg-white group-hover:opacity-100 small:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/85 text-aquora-ink opacity-0 shadow-sm backdrop-blur transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:translate-x-0.5 hover:bg-white group-hover:opacity-100 small:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </button>
              <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium tabular-nums text-aquora-muted backdrop-blur">
                {active + 1} / {valid.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {multi && (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {valid.map((image, index) => (
            <button
              key={image.id || index}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] small:w-[4.5rem] ${
                index === active
                  ? "border-aquora-primary ring-1 ring-aquora-primary"
                  : "border-black/[0.08] hover:border-aquora-primary/40 hover:-translate-y-0.5"
              }`}
            >
              <Image
                src={image.url as string}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${label} — enlarged`}
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-aquora-secondary/95 p-4 backdrop-blur-sm small:p-10"
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Close zoom"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <div
            className="relative h-[80vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={valid[active].url as string}
              alt={`${label} — enlarged view ${active + 1} of ${valid.length}`}
              fill
              sizes="92vw"
              className="object-contain"
            />
          </div>
          {multi && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 small:left-8"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                aria-label="Next image"
                className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 small:right-8"
              >
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium tabular-nums text-white">
                {active + 1} / {valid.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
