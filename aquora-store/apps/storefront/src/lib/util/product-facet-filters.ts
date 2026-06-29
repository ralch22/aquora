import { HttpTypes } from "@medusajs/types"

// URL query keys for the PLP brand + price facets. Kept distinct from the
// option-value filter (see product-option-filters.ts) so all three compose.
export const BRAND_QUERY_KEY = "brand"
export const MIN_PRICE_QUERY_KEY = "minPrice"
export const MAX_PRICE_QUERY_KEY = "maxPrice"

export type BrandFilters = string[]

export type PriceRange = {
  min?: number
  max?: number
}

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

const isURLSearchParams = (sp: SearchParamsLike): sp is URLSearchParams =>
  typeof (sp as URLSearchParams).getAll === "function"

/**
 * Parse the selected brand filters from either a URLSearchParams (client) or a
 * plain searchParams object (server page). Mirrors parseOptionValueIds.
 */
export const parseBrandFilters = (sp: SearchParamsLike): BrandFilters => {
  if (isURLSearchParams(sp)) {
    return Array.from(new Set(sp.getAll(BRAND_QUERY_KEY).filter(Boolean)))
  }

  const value = sp[BRAND_QUERY_KEY]
  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter(Boolean)))
  }
  if (typeof value === "string" && value.length > 0) {
    return value.split(",").filter(Boolean)
  }
  return []
}

const parseNumberParam = (
  sp: SearchParamsLike,
  key: string
): number | undefined => {
  const raw = isURLSearchParams(sp) ? sp.get(key) : sp[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== "string" || value.length === 0) {
    return undefined
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export const parsePriceRange = (sp: SearchParamsLike): PriceRange => ({
  min: parseNumberParam(sp, MIN_PRICE_QUERY_KEY),
  max: parseNumberParam(sp, MAX_PRICE_QUERY_KEY),
})

export const hasPriceRange = (range: PriceRange): boolean =>
  range.min !== undefined || range.max !== undefined

// Bounded, shareable price buckets (AED). calculated_amount is in major units.
export const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Under AED 100", max: 100 },
  { label: "AED 100 – 500", min: 100, max: 500 },
  { label: "AED 500 – 2,000", min: 500, max: 2000 },
  { label: "AED 2,000 – 10,000", min: 2000, max: 10000 },
  { label: "AED 10,000+", min: 10000 },
]

const getProductMinPrice = (
  product: HttpTypes.StoreProduct
): number | undefined => {
  const amounts = (product.variants || [])
    .map((v) => (v as any)?.calculated_price?.calculated_amount as number)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
  return amounts.length ? Math.min(...amounts) : undefined
}

const getProductBrand = (product: HttpTypes.StoreProduct): string | undefined =>
  ((product.metadata as any)?.brand as string | undefined)?.trim() || undefined

/**
 * Filter an already-fetched product window by the brand + price facets. Done
 * client-side (in the server action) because the store API can't filter on
 * metadata.brand or calculated_price. Mirrors the existing sortProducts pattern.
 */
export const filterProductsByFacets = (
  products: HttpTypes.StoreProduct[],
  {
    brands,
    price,
  }: {
    brands?: BrandFilters
    price?: PriceRange
  }
): HttpTypes.StoreProduct[] => {
  const brandSet =
    brands && brands.length
      ? new Set(brands.map((b) => b.toLowerCase()))
      : null
  const range = price && hasPriceRange(price) ? price : null

  if (!brandSet && !range) {
    return products
  }

  return products.filter((product) => {
    if (brandSet) {
      const brand = getProductBrand(product)?.toLowerCase()
      if (!brand || !brandSet.has(brand)) {
        return false
      }
    }

    if (range) {
      const minPrice = getProductMinPrice(product)
      if (minPrice === undefined) {
        return false
      }
      if (range.min !== undefined && minPrice < range.min) {
        return false
      }
      if (range.max !== undefined && minPrice > range.max) {
        return false
      }
    }

    return true
  })
}
