import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"
import { getReviewAggregate } from "@lib/data/reviews"

// Product structured data (schema.org) for rich results / SEO.
export default async function ProductJsonLd({ product }: { product: HttpTypes.StoreProduct }) {
  const base = getBaseURL()
  // Real review aggregate (count + average). Null when no approved reviews exist or on error —
  // we then emit NO aggregateRating (never fabricate a rating to win a rich-result snippet).
  const rating = await getReviewAggregate(product.id)
  const variant: any = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount
  const image = product.thumbnail || product.images?.[0]?.url || undefined
  const brand = (product.metadata as any)?.brand as string | undefined
  const overview = ((product.metadata as any)?.overview as string | undefined) || product.description || ""
  const cat = (product as any).categories?.[0] as { name?: string; handle?: string } | undefined
  const category = cat?.name as string | undefined
  const specs = ((product.metadata as any)?.specs as { name: string; value: string }[]) || []

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: overview.slice(0, 320),
    ...(image ? { image } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(category ? { category } : {}),
    ...(specs.length
      ? { additionalProperty: specs.map((s) => ({ "@type": "PropertyValue", name: s.name, value: s.value })) }
      : {}),
    ...(variant?.sku ? { sku: variant.sku } : {}),
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(rating.average),
            reviewCount: String(rating.count),
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "AED",
            price: String(price),
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "Aquora" },
          },
        }
      : {}),
  }

  const crumbs: any[] = [{ "@type": "ListItem", position: 1, name: "Shop", item: `${base}/ae/store` }]
  if (cat?.handle) crumbs.push({ "@type": "ListItem", position: 2, name: cat.name, item: `${base}/ae/categories/${cat.handle}` })
  crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: product.title })

  const breadcrumb = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: crumbs,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([data, breadcrumb]) }}
    />
  )
}
