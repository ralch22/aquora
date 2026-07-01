import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductVideo } from "@lib/aquora/videos"
import type { PickCard } from "./fetch"

// Shared presentational grid of real product cards — the flat-card markup used on the search /
// category grids, reused so Pool Care placements match the rest of the store. Renders nothing
// when there are no products (callers self-hide via this).
export default function FlatCardGrid({
  products,
  eyebrow,
  title,
  cols = 3,
}: {
  products: PickCard[]
  eyebrow?: string
  title?: string
  cols?: 2 | 3 | 4
}) {
  if (!products.length) return null
  const grid =
    cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 small:grid-cols-4" : "grid-cols-2 small:grid-cols-3"
  return (
    <div>
      {(eyebrow || title) && (
        <div className="mb-3">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-aquora-primary">{eyebrow}</p>
          )}
          {title && <h3 className="font-heading text-base font-bold text-aquora-ink">{title}</h3>}
        </div>
      )}
      <ul className={`aq-grid-in grid ${grid} gap-x-4 gap-y-6`}>
        {products.map((p) => (
          <li key={p.handle}>
            <LocalizedClientLink href={`/products/${p.handle}`} className="group block">
              <div className="relative aspect-square bg-aquora-surface rounded-large overflow-hidden border border-black/5">
                {p.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-aquora-muted text-xs">No image</div>
                )}
                {getProductVideo(p.handle) && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-aquora-secondary/85 py-0.5 pl-1.5 pr-2 text-[10px] font-semibold text-white backdrop-blur">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Video
                  </span>
                )}
              </div>
              <h4 className="mt-2 text-sm text-aquora-ink leading-snug line-clamp-2 group-hover:text-aquora-primary transition-colors">
                {p.title}
              </h4>
              {p.price != null && (
                <p className="text-sm font-semibold text-aquora-ink mt-1">
                  AED {Number(p.price).toLocaleString("en-AE")}
                </p>
              )}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
