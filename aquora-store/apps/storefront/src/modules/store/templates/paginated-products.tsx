import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

// In-grid promotional tile (a merchandising technique competitors use within result grids).
// Spans two columns; honest copy (free delivery + the free advisor). Shown once, on page 1.
function GridPromoTile() {
  return (
    <li className="col-span-2 row-span-1">
      <LocalizedClientLink
        href="/pool-care"
        className="group relative flex h-full min-h-[230px] flex-col justify-between overflow-hidden rounded-[1.4rem] bg-gradient-to-br from-aquora-secondary to-aquora-primary p-6 text-white shadow-[0_24px_50px_-30px_rgba(10,58,66,0.6)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
      >
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.06]" preserveAspectRatio="none" viewBox="0 0 400 300" fill="none">
          <path d="M0 210 Q 100 170 200 210 T 400 210" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 245 Q 100 205 200 245 T 400 245" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-aquora-accent/40 bg-aquora-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-aquora-accent">
            Free UAE delivery over AED 500
          </span>
          <h3 className="mt-4 max-w-[16rem] font-heading text-xl font-bold leading-tight tracking-tight small:text-2xl">
            Not sure what fits your pool?
          </h3>
          <p className="mt-2 max-w-[20rem] text-sm leading-relaxed text-white/75">
            Use our free dosing, sizing and problem-solving tools — or ask Aqua, our AI advisor.
          </p>
        </div>
        <span className="relative mt-5 inline-flex w-max items-center gap-2 rounded-full bg-aquora-accent px-5 py-2.5 text-sm font-semibold text-aquora-ink transition-transform duration-300 group-hover:-translate-y-0.5">
          Open Pool Care
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
          </svg>
        </span>
      </LocalizedClientLink>
    </li>
  )
}

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    optionValueIds,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.flatMap((p, i) => {
          const card = (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
          // Inject the promo tile once, after the 4th product on the first page.
          return page === 1 && i === 4 ? [<GridPromoTile key="grid-promo" />, card] : [card]
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
