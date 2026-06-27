import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { topSpecChips } from "@lib/aquora/specs"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const category = (product as any).categories?.[0] as { name?: string; handle?: string } | undefined
  const md = (product.metadata as any) || {}
  const brand = md.brand as string | undefined
  const overview = (md.overview as string | undefined) || product.description
  const idealFor = md.idealFor as string | undefined
  const rawSku = (product.variants?.[0] as any)?.sku as string | undefined
  // The catalogue's source SKUs were null, so the import used the slug as a fallback;
  // only surface a genuine, short part-number-style reference (not the long slug).
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  const sku =
    rawSku && rawSku.length <= 20 && norm(rawSku) !== norm(product.handle || "")
      ? rawSku
      : undefined
  const specs = topSpecChips(md.specs, product.title || "")

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-aquora-muted flex flex-wrap items-center gap-1.5">
          <LocalizedClientLink href="/store" className="hover:text-aquora-primary">
            Shop
          </LocalizedClientLink>
          {category?.handle && (
            <>
              <span aria-hidden>/</span>
              <LocalizedClientLink href={`/categories/${category.handle}`} className="hover:text-aquora-primary">
                {category.name}
              </LocalizedClientLink>
            </>
          )}
        </nav>

        {brand && (
          <LocalizedClientLink
            href={`/search?q=${encodeURIComponent(brand)}`}
            className="text-sm font-semibold uppercase tracking-wide text-aquora-primary hover:underline w-fit"
          >
            {brand}
          </LocalizedClientLink>
        )}

        <Heading level="h2" className="text-3xl leading-10 text-aquora-ink" data-testid="product-title">
          {product.title}
        </Heading>

        {/* Derived spec chips */}
        {specs.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Key specifications">
            {specs.map((s) => (
              <li
                key={s.label}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-black/10 bg-aquora-surface px-3 py-1 text-xs"
              >
                <span className="text-aquora-muted">{s.label}</span>
                <span className="font-semibold text-aquora-ink">{s.value}</span>
              </li>
            ))}
          </ul>
        )}

        <Text className="text-medium text-aquora-muted whitespace-pre-line" data-testid="product-description">
          {overview}
        </Text>

        {idealFor && (
          <p className="text-sm text-aquora-muted">
            <span className="font-semibold text-aquora-ink">Ideal for</span> — {idealFor}
          </p>
        )}

        {sku && (
          <p className="text-xs uppercase tracking-wide text-aquora-muted/80">Ref: {sku}</p>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
