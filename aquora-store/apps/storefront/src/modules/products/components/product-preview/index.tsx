import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const brand = (product.metadata as any)?.brand as string | undefined

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group block" data-testid="product-wrapper">
      {/* Double-bezel: outer shell + inner image core */}
      <div className="relative overflow-hidden rounded-[1.4rem] border border-black/[0.06] bg-white p-2 shadow-[0_1px_2px_rgba(11,31,36,0.04)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1.5 group-hover:border-aquora-primary/25 group-hover:shadow-[0_24px_44px_-22px_rgba(14,110,115,0.28)]">
        <div className="relative overflow-hidden rounded-[1.05rem] bg-aquora-surface">
          <div className="transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
            <Thumbnail thumbnail={product.thumbnail} images={product.images} size="full" isFeatured={isFeatured} />
          </div>
          {brand && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-aquora-primary backdrop-blur">
              {brand}
            </span>
          )}
          {/* hover sheen */}
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
