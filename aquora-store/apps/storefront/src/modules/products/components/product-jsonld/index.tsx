import { HttpTypes } from "@medusajs/types"

// Product structured data (schema.org) for rich results / SEO.
export default function ProductJsonLd({ product }: { product: HttpTypes.StoreProduct }) {
  const variant: any = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount
  const image = product.thumbnail || product.images?.[0]?.url || undefined
  const brand = (product.metadata as any)?.brand as string | undefined
  const category = (product as any).categories?.[0]?.name as string | undefined

  const data: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    description: (product.description || "").slice(0, 320),
    ...(image ? { image } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(category ? { category } : {}),
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
