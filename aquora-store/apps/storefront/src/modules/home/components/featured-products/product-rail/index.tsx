import { listProducts } from "@lib/data/products"
import { getReviewAggregates } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import ProductListTracker from "@modules/analytics/product-list-tracker"
import { toListItems } from "@lib/aquora/list-items"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  // One batched request for real review ratings across the rail (no per-card N+1).
  const ratings = await getReviewAggregates(pricedProducts.map((p) => p.id))

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex justify-between mb-8">
        <Text className="txt-xlarge">{collection.title}</Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ProductListTracker
        listName={`collection:${collection.handle}`}
        items={toListItems(pricedProducts)}
      >
        <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36">
          {pricedProducts &&
            pricedProducts.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} rating={ratings[product.id]} isFeatured />
              </li>
            ))}
        </ul>
      </ProductListTracker>
    </div>
  )
}
