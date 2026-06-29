import { getRegion } from "@lib/data/regions"
import { getCategoryByHandle } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import ProductListTracker from "@modules/analytics/product-list-tracker"
import { productToItem } from "@lib/util/product-to-item"
import Carousel from "@modules/common/components/carousel"
import InteractiveLink from "@modules/common/components/interactive-link"

// A horizontal rail of real products fetched from a category — the homepage's first actual
// product surfacing. No-ops (renders nothing) if the region/category/products can't be loaded.
export default async function ProductShelf({
  countryCode,
  handle,
  eyebrow,
  title,
  limit = 10,
}: {
  countryCode: string
  handle: string
  eyebrow?: string
  title: string
  limit?: number
}) {
  const region = await getRegion(countryCode)
  if (!region) return null

  let categoryId: string | undefined
  try {
    const cat = await getCategoryByHandle([handle])
    categoryId = cat?.id
  } catch {
    return null
  }
  if (!categoryId) return null

  let products: any[] = []
  try {
    const res = await listProducts({
      regionId: region.id,
      queryParams: {
        category_id: [categoryId],
        limit,
        fields: "id,handle,title,thumbnail,*images,*variants.calculated_price,metadata",
      } as any,
    })
    products = res.response.products
  } catch {
    return null
  }
  if (!products?.length) return null

  return (
    <section className="content-container py-14 small:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
              {eyebrow}
            </p>
          )}
          <h2 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink small:text-[2rem]">
            {title}
          </h2>
        </div>
        <InteractiveLink href={`/categories/${handle}`}>View all</InteractiveLink>
      </div>
      <ProductListTracker
        listName={`shelf:${handle}`}
        listId={handle}
        items={products.map(productToItem)}
      >
        <Carousel>
          {products.map((p) => (
            <div key={p.id} className="w-[210px] shrink-0 snap-start small:w-[240px]">
              <ProductPreview product={p} region={region} />
            </div>
          ))}
        </Carousel>
      </ProductListTracker>
    </section>
  )
}
