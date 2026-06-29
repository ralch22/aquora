// Shared parsing for the PLP brand + price-range facets (WS4-PR6). Used by the server
// pages (Record<string,...> searchParams) and the client refinement-list (URLSearchParams),
// mirroring product-option-filters.ts so both sides agree on the URL contract.
export const BRAND_QUERY_KEY = "brand"
export const MIN_PRICE_QUERY_KEY = "minPrice"
export const MAX_PRICE_QUERY_KEY = "maxPrice"

export type FacetFilters = {
  brands: string[]
  minPrice?: number
  maxPrice?: number
}

type AnyParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

const isURLSearchParams = (sp: AnyParams): sp is URLSearchParams =>
  typeof (sp as URLSearchParams).getAll === "function"

const parseBrands = (sp: AnyParams): string[] => {
  if (isURLSearchParams(sp)) {
    return Array.from(new Set(sp.getAll(BRAND_QUERY_KEY).filter(Boolean)))
  }

  const value = (sp as Record<string, string | string[] | undefined>)[
    BRAND_QUERY_KEY
  ]

  if (Array.isArray(value)) {
    return Array.from(new Set(value.filter(Boolean)))
  }

  if (typeof value === "string" && value.length > 0) {
    // Comma-separated fallback so shared/short links keep working.
    return Array.from(new Set(value.split(",").filter(Boolean)))
  }

  return []
}

const parsePrice = (sp: AnyParams, key: string): number | undefined => {
  const raw = isURLSearchParams(sp)
    ? sp.get(key)
    : (() => {
        const value = (sp as Record<string, string | string[] | undefined>)[key]
        return Array.isArray(value) ? value[0] : value
      })()

  if (raw == null || raw === "") {
    return undefined
  }

  const n = Number(raw)
  // Ignore non-numeric / negative input rather than throwing on a bad URL.
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

export const parseFacetFilters = (sp: AnyParams): FacetFilters => {
  let minPrice = parsePrice(sp, MIN_PRICE_QUERY_KEY)
  let maxPrice = parsePrice(sp, MAX_PRICE_QUERY_KEY)

  // Normalise an inverted range so min<=max always holds downstream.
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }

  return {
    brands: parseBrands(sp),
    minPrice,
    maxPrice,
  }
}

export const hasActiveFacets = (f: FacetFilters): boolean =>
  f.brands.length > 0 || f.minPrice != null || f.maxPrice != null
