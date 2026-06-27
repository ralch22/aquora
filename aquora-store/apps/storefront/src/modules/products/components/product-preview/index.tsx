import Image from "next/image"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { getProductVideo } from "@lib/aquora/videos"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured: _isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const brand = (product.metadata as any)?.brand as string | undefined
  const img = product.thumbnail || product.images?.[0]?.url
  const hasVideo = !!getProductVideo(product.handle)

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block" data-testid="product-wrapper">
      {/* Double-bezel: outer shell + inner image core. object-contain so equipment is never cropped. */}
      <div className="relative overflow-hidden rounded-[1.4rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:border-aquora-primary/25 group-hover:shadow-[0_24px_44px_-22px_rgba(14,110,115,0.28)]">
        <div className="relative aspect-square overflow-hidden rounded-[1.05rem] bg-gradient-to-b from-white to-aquora-surface">
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              quality={55}
              sizes="(max-width: 576px) 50vw, (max-width: 992px) 33vw, 25vw"
              className="object-contain p-5 transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-aquora-muted">
              <PlaceholderImage size={28} />
            </div>
          )}
          {brand && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-aquora-primary backdrop-blur">
              {brand}
            </span>
          )}
          {hasVideo && (
            <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-aquora-secondary/85 py-0.5 pl-1.5 pr-2 text-[10px] font-semibold text-white backdrop-blur">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              Video
            </span>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-aquora-secondary/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      </div>

      <div className="px-1 pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-aquora-ink transition-colors duration-200 group-hover:text-aquora-primary" data-testid="product-title">
          {product.title}
        </h3>
        {cheapestPrice && (
          <div className="mt-1 text-sm font-bold text-aquora-ink">
            <PreviewPrice price={cheapestPrice} />
          </div>
        )}
      </div>
    </LocalizedClientLink>
  )
}
