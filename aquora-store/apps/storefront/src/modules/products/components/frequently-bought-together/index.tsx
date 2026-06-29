import { listProducts } from "@lib/data/products"
import { getCategoryByHandle } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { COMPLEMENTARY } from "@lib/aquora/complementary"
import Product from "../product-preview"
import ProductListTracker from "@modules/analytics/product-list-tracker"
import { productToItem } from "@lib/util/product-to-item"

type Props = { product: HttpTypes.StoreProduct; countryCode: string }

// "Complete the setup" — products from COMPLEMENTARY categories (honest category
// heuristic, not fabricated order analytics). Renders nothing when nothing fits.
export default async function FrequentlyBoughtTogether({ product, countryCode }: Props) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const cats = ((product as any).categories || []) as { handle?: string }[]
  let compHandles: string[] = []
  for (const c of cats) {
    if (c.handle && COMPLEMENTARY[c.handle]) {
      compHandles = COMPLEMENTARY[c.handle]
      break
    }
  }
  if (!compHandles.length) return null

  const resolved = await Promise.all(
    compHandles.map((h) => getCategoryByHandle([h]).catch(() => null))
  )
  const ids = resolved.map((c: any) => c?.id).filter(Boolean) as string[]
  if (!ids.length) return null

  const queryParams: HttpTypes.StoreProductListParams = {
    is_giftcard: false,
    category_id: ids,
  }
  if (region?.id) queryParams.region_id = region.id

  const products = await listProducts({ queryParams, countryCode }).then(({ response }) =>
    response.products.filter((p) => p.id !== product.id).slice(0, 3)
  )
  if (products.length < 2) return null

  return (
    <div className="product-page-constraint">
      <div className="mb-8">
        <span className="text-aquora-accent text-xs font-semibold uppercase tracking-widest">
          Complete the setup
        </span>
        <p className="mt-2 font-heading text-2xl text-aquora-ink">Frequently bought together</p>
      </div>
      <ProductListTracker
        listName="frequently_bought_together"
        listId={product.handle}
        items={products.map(productToItem)}
      >
        <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-8">
          {products.map((p) => (
            <li key={p.id}>
              <Product region={region} product={p} />
            </li>
          ))}
        </ul>
      </ProductListTracker>
    </div>
  )
}
