import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getReviewAggregates } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"
import ProductListTracker from "@modules/analytics/product-list-tracker"
import { toListItems } from "@lib/aquora/list-items"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Aquora products are organised by category (no collections/tags) -> relate by category.
  const queryParams: HttpTypes.StoreProductListParams = { is_giftcard: false }
  if (region?.id) {
    queryParams.region_id = region.id
  }
  const catIds = ((product as any).categories || [])
    .map((c: any) => c?.id)
    .filter(Boolean) as string[]
  if (!catIds.length) {
    return null
  }
  queryParams.category_id = catIds

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) =>
    response.products
      .filter((responseProduct) => responseProduct.id !== product.id)
      .slice(0, 4)
  )

  if (!products.length) {
    return null
  }

  // One batched request for real review ratings across the rail (no per-card N+1).
  const ratings = await getReviewAggregates(products.map((p) => p.id))

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-10">
        <span className="text-aquora-accent text-xs font-semibold uppercase tracking-widest mb-2">
          More from this range
        </span>
        <p className="font-heading text-2xl text-aquora-ink">
          You might also like
        </p>
      </div>

      <ProductListTracker listName="related" items={toListItems(products)}>
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
          {products.map((product) => (
            <li key={product.id}>
              <Product region={region} product={product} rating={ratings[product.id]} />
            </li>
          ))}
        </ul>
      </ProductListTracker>
    </div>
  )
}
