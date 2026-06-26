import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { parseSpecs } from "@lib/aquora/specs"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const category = (product as any).categories?.[0] as { name?: string; handle?: string } | undefined
  const brand = (product.metadata as any)?.brand as string | undefined
  const specs = parseSpecs(product.title || "")

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

        <Heading level="h2" className="text-3xl leading-10 text-ui-fg-base" data-testid="product-title">
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

        <Text className="text-medium text-ui-fg-subtle whitespace-pre-line" data-testid="product-description">
          {product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
