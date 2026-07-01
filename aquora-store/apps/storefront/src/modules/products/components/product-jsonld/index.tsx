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

  // Merchant-listing enrichment for the Offer. Every value reflects real, published Aquora policy:
  //  - shipping: /legal/shipping — free UAE delivery over AED 500, else a flat AED 30; 0-1 day
  //    handling (Sun-Thu) + 2-4 working-day UAE transit.
  //  - returns: /legal/returns — 14-day window, return by mail, buyer pays return shipping unless
  //    the item is faulty/incorrect. Nothing here is fabricated to win a snippet.
  const priceValidUntil = new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10)
  const deliveryTime = {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 4, unitCode: "DAY" },
  }
  const shippingDetails = [
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "AED" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "AE" },
      eligibleTransactionVolume: { "@type": "PriceSpecification", priceCurrency: "AED", minPrice: "500" },
      deliveryTime,
    },
    {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: "30", currency: "AED" },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "AE" },
      deliveryTime,
    },
  ]
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "AE",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
  }

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
            priceValidUntil,
            url: `${base}/ae/products/${product.handle}`,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: "Aquora" },
            shippingDetails,
            hasMerchantReturnPolicy: returnPolicy,
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
