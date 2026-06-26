import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"

// Product structured data (schema.org) for rich results / SEO.
export default function ProductJsonLd({ product }: { product: HttpTypes.StoreProduct }) {
  const base = getBaseURL()
  const variant: any = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount
  const image = product.thumbnail || product.images?.[0]?.url || undefined
  const brand = (product.metadata as any)?.brand as string | undefined
  const cat = (product as any).categories?.[0] as { name?: string; handle?: string } | undefined
  const category = cat?.name as string | undefined
  const specs = ((product.metadata as any)?.specs as { name: string; value: string }[]) || []

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: (product.description || "").slice(0, 320),
    ...(image ? { image } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(category ? { category } : {}),
    ...(specs.length
      ? { additionalProperty: specs.map((s) => ({ "@type": "PropertyValue", name: s.name, value: s.value })) }
      : {}),
    ...(variant?.sku ? { sku: variant.sku } : {}),
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
