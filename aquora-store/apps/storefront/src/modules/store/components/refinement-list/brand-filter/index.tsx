"use client"

import { useMemo, useState } from "react"
import clsx from "clsx"

import { brands } from "@lib/aquora/brands"

// Bounded brand list — show the top brands by real catalogue count (from
// product metadata.brand), with an expander for the rest. Keeps the facet light
// at 6k-product scale rather than enumerating every distinct brand.
const COLLAPSED_COUNT = 10

type BrandFilterProps = {
  selectedBrands: string[]
  setBrands: (brands: string[]) => void
}

const BrandFilter = ({ selectedBrands, setBrands }: BrandFilterProps) => {
  const [expanded, setExpanded] = useState(false)

  const selectedSet = useMemo(
    () => new Set(selectedBrands),
    [selectedBrands]
  )

  const visible = expanded ? brands : brands.slice(0, COLLAPSED_COUNT)

  const toggleBrand = (name: string) => {
    const next = selectedSet.has(name)
      ? selectedBrands.filter((b) => b !== name)
      : [...selectedBrands, name]
    setBrands(Array.from(new Set(next)))
  }

  return (
    <div className="flex flex-col gap-y-3 pr-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-aquora-ink">Brand</span>
        {selectedBrands.length > 0 && (
          <button
            type="button"
            onClick={() => setBrands([])}
            className="text-xs text-aquora-muted hover:text-aquora-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-y-1">
        {visible.map((b) => {
          const isSelected = selectedSet.has(b.name)
          return (
            <li key={b.name}>
              <label
                className={clsx(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "text-aquora-ink"
                    : "text-aquora-muted hover:text-aquora-ink"
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleBrand(b.name)}
                    className="h-4 w-4 rounded border-black/20 text-aquora-primary accent-aquora-primary"
                  />
                  {b.name}
                </span>
                <span className="text-xs text-aquora-muted/70">{b.count}</span>
              </label>
            </li>
          )
        })}
      </ul>
      {brands.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-xs font-medium text-aquora-primary hover:underline"
        >
          {expanded ? "Show fewer brands" : `Show all ${brands.length} brands`}
        </button>
      )}
    </div>
  )
}

export default BrandFilter
