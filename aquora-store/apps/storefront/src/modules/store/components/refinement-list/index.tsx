"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import {
  BRAND_QUERY_KEY,
  MAX_PRICE_QUERY_KEY,
  MIN_PRICE_QUERY_KEY,
  PriceRange,
  parseBrandFilters,
  parsePriceRange,
} from "@lib/util/product-facet-filters"
import OptionsPicker from "./options-picker"
import BrandFilter from "./brand-filter"
import PriceFilter from "./price-filter"
import SortProducts, { SortOptions } from "./sort-products"
import { categories } from "@lib/aquora/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  hideOptionsPicker?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  hideOptionsPicker = false,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
      }
    },
    [pathname, router, searchParams]
  )

  const setQueryParams = (name: string, value: string) =>
    updateQueryParams((params) => params.set(name, value))

  const selectedOptionValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams]
  )

  const setOptionValueIds = (valueIds: string[]) =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      valueIds.forEach((valueId) =>
        params.append(OPTION_VALUE_QUERY_KEY, valueId)
      )
    })

  const selectedBrands = useMemo(
    () => parseBrandFilters(searchParams),
    [searchParams]
  )

  const setBrands = (nextBrands: string[]) =>
    updateQueryParams((params) => {
      params.delete(BRAND_QUERY_KEY)
      nextBrands.forEach((brand) => params.append(BRAND_QUERY_KEY, brand))
    })

  const priceRange = useMemo(
    () => parsePriceRange(searchParams),
    [searchParams]
  )

  const setPriceRange = (range: PriceRange) =>
    updateQueryParams((params) => {
      params.delete(MIN_PRICE_QUERY_KEY)
      params.delete(MAX_PRICE_QUERY_KEY)
      if (range.min !== undefined) {
        params.set(MIN_PRICE_QUERY_KEY, String(range.min))
      }
      if (range.max !== undefined) {
        params.set(MAX_PRICE_QUERY_KEY, String(range.max))
      }
    })

  return (
    <div className="flex flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      <SortProducts
        sortBy={sortBy}
        setQueryParams={setQueryParams}
        data-testid={dataTestId}
      />
      {!hideOptionsPicker && (
        <OptionsPicker
          selectedValueIds={selectedOptionValueIds}
          setOptionValueIds={setOptionValueIds}
        />
      )}
      <BrandFilter selectedBrands={selectedBrands} setBrands={setBrands} />
      <PriceFilter priceRange={priceRange} setPriceRange={setPriceRange} />
      <div className="flex flex-col gap-y-3">
        <span className="text-sm font-semibold text-aquora-ink">Shop by category</span>
        <ul className="flex flex-col gap-y-1.5">
          {categories.map((c) => (
            <li key={c.handle}>
              <LocalizedClientLink
                href={`/categories/${c.handle}`}
                className="text-sm text-aquora-muted hover:text-aquora-primary transition-colors duration-150"
              >
                {c.name}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
        <LocalizedClientLink href="/brands" className="text-sm font-medium text-aquora-primary hover:underline">
          Browse by brand →
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default RefinementList
