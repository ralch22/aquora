import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ImageBanner from "@modules/common/components/image-banner"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <>
      <div className="content-container pt-6">
        <ImageBanner
          image="/images/brand/editorial-delivery.webp"
          imageAlt="Genuine pool equipment delivered free across the UAE"
          eyebrow="Curated & in stock"
          headline="Free delivery over AED 500"
          text="Genuine, warrantied equipment — stocked and shipped fast across the UAE & GCC."
          cta={{ label: "Need help choosing?", href: "/pool-care" }}
          variant="strip"
          align="left"
        />
      </div>
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList sortBy={sort} hideOptionsPicker />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>{collection.title}</h1>
        </div>
        {/* Inline, not a streamed <Suspense> — deferred Suspense boundaries don't flush React's
            `$RC` in this deployment, leaving the grid stuck behind its skeleton. */}
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          collectionId={collection.id}
          countryCode={countryCode}
          optionValueIds={optionValueIds}
        />
      </div>
    </div>
    </>
  )
}
