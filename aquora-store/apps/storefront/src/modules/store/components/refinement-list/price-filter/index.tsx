"use client"

import clsx from "clsx"

import { PRICE_RANGES, PriceRange } from "@lib/util/product-facet-filters"

type PriceFilterProps = {
  priceRange: PriceRange
  setPriceRange: (range: PriceRange) => void
}

const sameRange = (a: PriceRange, b: PriceRange) =>
  a.min === b.min && a.max === b.max

const PriceFilter = ({ priceRange, setPriceRange }: PriceFilterProps) => {
  const isActive = priceRange.min !== undefined || priceRange.max !== undefined

  return (
    <div className="flex flex-col gap-y-3 pr-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-aquora-ink">Price</span>
        {isActive && (
          <button
            type="button"
            onClick={() => setPriceRange({})}
            className="text-xs text-aquora-muted hover:text-aquora-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-y-1">
        {PRICE_RANGES.map((range) => {
          const selected = sameRange(priceRange, {
            min: range.min,
            max: range.max,
          })
          return (
            <li key={range.label}>
              <label
                className={clsx(
                  "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors",
                  selected
                    ? "text-aquora-ink"
                    : "text-aquora-muted hover:text-aquora-ink"
                )}
              >
                <input
                  type="radio"
                  name="price-range"
                  checked={selected}
                  onChange={() =>
                    setPriceRange(
                      selected ? {} : { min: range.min, max: range.max }
                    )
                  }
                  className="h-4 w-4 border-black/20 text-aquora-primary accent-aquora-primary"
                />
                {range.label}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default PriceFilter
