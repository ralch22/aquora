import { OptionValueIds } from "@lib/util/product-option-filters"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import ImageBanner from "@modules/common/components/image-banner"

import PaginatedProducts from "./paginated-products"

// IMPORTANT: the grid is rendered INLINE, not inside a streamed <Suspense fallback={skeleton}>.
// In this deployment, deferred (post-shell) Suspense boundaries never receive React's `$RC`
// completion script, so a streamed grid stays stuck behind its skeleton and never hydrates
// (the heart/compare buttons inside it stay inert). Resolving the grid before the shell flushes —
// the same inline pattern the homepage product shelves use — makes it paint AND hydrate.

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <>
      <div className="content-container pt-6">
        <ImageBanner
          image="/images/brand/editorial-delivery.webp"
          imageAlt="Free pool equipment delivery across the UAE"
          eyebrow="Across the UAE"
          headline="Free delivery over AED 500"
          text="Genuine, engineered equipment — delivered fast across the Emirates."
          cta={{ label: "Need help choosing?", href: "/pool-care" }}
          variant="strip"
          align="left"
        />
      </div>
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">All products</h1>
        </div>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          countryCode={countryCode}
          optionValueIds={optionValueIds}
        />
      </div>
    </div>
    </>
  )
}

export default StoreTemplate
