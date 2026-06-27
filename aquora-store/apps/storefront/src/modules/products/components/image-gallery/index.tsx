"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

// Thumbnail-strip gallery: a large double-bezel main image (object-contain so
// equipment is never cropped) with a crossfade, a clickable thumbnail row, arrow
// nav + counter. Falls back gracefully to a single image.
const ImageGallery = ({ images }: ImageGalleryProps) => {
  const valid = (images || []).filter((i) => !!i.url)
  const [selected, setSelected] = useState(0)
  const multi = valid.length > 1

  if (!valid.length) return null

  // Clamp so a variant switch (fewer images) can never blank the main image.
  const active = Math.min(selected, valid.length - 1)
  const go = (dir: number) => setSelected((a) => (Math.min(a, valid.length - 1) + dir + valid.length) % valid.length)

  return (
    <div className="flex flex-col gap-4 small:mx-4 lg:mx-8">
      {/* Main image — double-bezel */}
      <div className="rounded-[1.7rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)]">
        <div className="group relative aspect-square overflow-hidden rounded-[1.3rem] bg-gradient-to-b from-white to-aquora-surface">
          {valid.map((image, index) => (
            <Image
              key={image.id || index}
              src={image.url as string}
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              className={`object-contain p-7 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                index === active ? "opacity-100" : "opacity-0"
              }`}
              alt={`Product image ${index + 1}`}
              fill
              sizes="(max-width: 992px) 92vw, 640px"
            />
          ))}

          {multi && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-black/5 bg-white/85 text-aquora-ink opacity-0 shadow-sm backdrop-blur transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-x-0.5 hover:bg-white group-hover:opacity-100 small:opacity-100"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10 3 5 8l5 5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
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
    </div>
  )
}

export default ImageGallery
