"use client"

import * as Accordion from "@radix-ui/react-accordion"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import clsx from "clsx"

import { ChevronDownMini } from "@medusajs/icons"
import { brands as allBrands } from "@lib/aquora/brands"
import { brandLogo } from "@lib/aquora/brand-logos"
import {
  BRAND_QUERY_KEY,
  MAX_PRICE_QUERY_KEY,
  MIN_PRICE_QUERY_KEY,
  parseFacetFilters,
} from "@lib/util/facet-filters"

// Bounded brand facet — only the leading manufacturers by catalogue count, never all 6k
// products' brands. Real values from product metadata.brand (see backend extract-brands.ts),
// surfaced via the generated @lib/aquora/brands directory.
const TOP_BRAND_COUNT = 14
const topBrands = allBrands.slice(0, TOP_BRAND_COUNT)

// Honest, fixed AED price bands for pool/spa equipment (no fabricated data — just buckets).
const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Under AED 100", max: 100 },
  { label: "AED 100 – 500", min: 100, max: 500 },
  { label: "AED 500 – 2,000", min: 500, max: 2000 },
  { label: "AED 2,000 – 10,000", min: 2000, max: 10000 },
  { label: "AED 10,000+", min: 10000 },
]

const Facets = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [openItems, setOpenItems] = useState<string[]>(["brand", "price"])

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      // Reset to page 1 whenever a facet changes so pagination stays valid.
      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
      }
    },
    [pathname, router, searchParams]
  )

  const { brands: selectedBrands, minPrice, maxPrice } = useMemo(
    () => parseFacetFilters(searchParams),
    [searchParams]
  )

  const selectedBrandSet = useMemo(
    () => new Set(selectedBrands),
    [selectedBrands]
  )

  const toggleBrand = (name: string) =>
    updateQueryParams((params) => {
      const current = new Set(params.getAll(BRAND_QUERY_KEY))
      params.delete(BRAND_QUERY_KEY)
      if (current.has(name)) {
        current.delete(name)
      } else {
        current.add(name)
      }
      current.forEach((b) => params.append(BRAND_QUERY_KEY, b))
    })

  const isRangeActive = (min?: number, max?: number) =>
    (min ?? undefined) === (minPrice ?? undefined) &&
    (max ?? undefined) === (maxPrice ?? undefined)

  const setRange = (min?: number, max?: number) =>
    updateQueryParams((params) => {
      params.delete(MIN_PRICE_QUERY_KEY)
      params.delete(MAX_PRICE_QUERY_KEY)
      // Re-clicking the active band clears it (toggle off).
      if (isRangeActive(min, max)) {
        return
      }
      if (min != null) {
        params.set(MIN_PRICE_QUERY_KEY, String(min))
      }
      if (max != null) {
        params.set(MAX_PRICE_QUERY_KEY, String(max))
      }
    })

  const hasActive =
    selectedBrands.length > 0 || minPrice != null || maxPrice != null

  const clearAll = () =>
    updateQueryParams((params) => {
      params.delete(BRAND_QUERY_KEY)
      params.delete(MIN_PRICE_QUERY_KEY)
      params.delete(MAX_PRICE_QUERY_KEY)
    })

  const chevron = (open: boolean) => (
    <span
      className={clsx(
        "flex h-7 w-7 items-center justify-center text-aquora-muted transition-transform duration-150",
        { "rotate-180": open }
      )}
    >
      <ChevronDownMini />
    </span>
  )

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between px-1">
        <span className="txt-compact-small-plus text-aquora-muted">Filters</span>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium text-aquora-primary hover:underline"
            data-testid="clear-facets"
          >
            Clear all
          </button>
        )}
      </div>

      <Accordion.Root
        type="multiple"
        value={openItems}
        onValueChange={(values) => setOpenItems(values as string[])}
        className="flex flex-col gap-y-3 pr-6"
      >
        {/* Brand */}
        <Accordion.Item value="brand" className="overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left">
              <div className="flex items-center gap-2">
                <span className="txt-compact-small-plus text-aquora-ink">
                  Brand
                </span>
                {selectedBrands.length > 0 && (
                  <span className="txt-compact-small-plus text-aquora-muted">
                    ({selectedBrands.length})
                  </span>
                )}
              </div>
              {chevron(openItems.includes("brand"))}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-4 pt-1">
            <div className="flex flex-wrap gap-2" data-testid="brand-facet">
              {topBrands.map((b) => {
                const isSelected = selectedBrandSet.has(b.name)
                const logo = brandLogo(b.name)
                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => toggleBrand(b.name)}
                    aria-pressed={isSelected}
                    className={clsx(
                      "border-black/10 border text-small-regular h-10 rounded-lg px-3 flex items-center gap-2 transition-colors duration-150",
                      {
                        "border-aquora-primary text-aquora-ink": isSelected,
                        "text-aquora-muted hover:text-aquora-ink": !isSelected,
                      }
                    )}
                  >
                    {logo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        className="h-4 w-auto max-w-[46px] shrink-0 object-contain grayscale opacity-80"
                      />
                    )}
                    {b.name}
                  </button>
                )
              })}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {/* Price */}
        <Accordion.Item value="price" className="overflow-hidden">
          <Accordion.Header>
            <Accordion.Trigger className="flex w-full items-center justify-between py-3 text-left">
              <div className="flex items-center gap-2">
                <span className="txt-compact-small-plus text-aquora-ink">
                  Price
                </span>
                {(minPrice != null || maxPrice != null) && (
                  <span className="txt-compact-small-plus text-aquora-muted">
                    (1)
                  </span>
                )}
              </div>
              {chevron(openItems.includes("price"))}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-4 pt-1">
            <div className="flex flex-col gap-2" data-testid="price-facet">
              {PRICE_RANGES.map((r) => {
                const active = isRangeActive(r.min, r.max)
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setRange(r.min, r.max)}
                    aria-pressed={active}
                    className={clsx(
                      "border-black/10 border text-small-regular h-10 rounded-lg px-3 flex items-center justify-between transition-colors duration-150",
                      {
                        "border-aquora-primary text-aquora-ink": active,
                        "text-aquora-muted hover:text-aquora-ink": !active,
                      }
                    )}
                  >
                    {r.label}
                    {active && (
                      <span className="text-aquora-primary text-xs">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}

export default Facets
