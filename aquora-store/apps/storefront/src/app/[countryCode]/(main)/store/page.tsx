import { Metadata } from "next"

import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { parseFacetFilters } from "@lib/util/facet-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All Pool, Spa & Fountain Equipment | Aquora",
  description:
    "Browse Aquora's full catalogue of engineered pool, spa, pond and fountain equipment — pumps, filtration, heating, lighting, chemicals and more, delivered across the UAE & GCC.",
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  optionValueIds?: string | string[]
}

type Params = {
  searchParams: Promise<StorePageSearchParams>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)
  const facetFilters = parseFacetFilters(searchParams)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
      facetFilters={facetFilters}
    />
  )
}
