import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Search — Aquora",
  description: "Search Aquora's pool, spa, pond and fountain equipment catalogue.",
}

type FacetValue = { value: string; label: string; count: number }
type SearchResponse = {
  products: any[]
  facets: { brands?: FacetValue[]; categories?: FacetValue[]; price?: FacetValue[] }
  total: number
  page: number
  pageSize: number
  source?: string
}

type State = { q: string; brand: string[]; cat: string[]; price: string; page: number }

async function runSearch(state: State): Promise<SearchResponse> {
  const empty: SearchResponse = { products: [], facets: {}, total: 0, page: 1, pageSize: 24 }
  if (!state.q) return empty
  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  const p = new URLSearchParams({ q: state.q, page: String(state.page) })
  if (state.brand.length) p.set("brand", state.brand.join(","))
  if (state.cat.length) p.set("cat", state.cat.join(","))
  if (state.price) p.set("price", state.price)
  try {
    const r = await fetch(`${base}/store/search?${p.toString()}`, {
      headers: { "x-publishable-api-key": key },
      cache: "no-store",
    })
    if (!r.ok) return empty
    return await r.json()
  } catch {
    return empty
  }
}

function makeHref(s: State): string {
  const p = new URLSearchParams()
  if (s.q) p.set("q", s.q)
  if (s.brand.length) p.set("brand", s.brand.join(","))
  if (s.cat.length) p.set("cat", s.cat.join(","))
  if (s.price) p.set("price", s.price)
  if (s.page > 1) p.set("page", String(s.page))
  const str = p.toString()
  return `/search${str ? `?${str}` : ""}`
}

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function FacetGroup({
  title,
  options,
  selected,
  hrefFor,
}: {
  title: string
  options: FacetValue[]
  selected: string[]
  hrefFor: (value: string) => string
}) {
  if (!options?.length) return null
  return (
    <div className="border-b border-black/5 pb-5 mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-aquora-ink mb-3">{title}</h3>
      <ul className="flex flex-col gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value)
          return (
            <li key={o.value}>
              <LocalizedClientLink
                href={hrefFor(o.value)}
                className={`flex items-center justify-between gap-2 text-sm rounded-md px-2 py-1 -mx-2 transition-colors ${
                  on ? "text-aquora-primary font-semibold bg-aquora-primary/5" : "text-aquora-muted hover:text-aquora-ink hover:bg-black/[0.03]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`grid place-items-center h-4 w-4 rounded border ${
                      on ? "bg-aquora-primary border-aquora-primary text-white" : "border-black/20"
                    }`}
                  >
                    {on && (
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8l3.5 3.5L13 4" />
                      </svg>
                    )}
                  </span>
                  {o.label}
                </span>
                <span className="text-xs text-aquora-muted tabular-nums">{o.count}</span>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function FilterPanel({ state, facets }: { state: State; facets: SearchResponse["facets"] }) {
  const base = { ...state, page: 1 }
  return (
    <div>
      <FacetGroup
        title="Brand"
        options={facets.brands || []}
        selected={state.brand}
        hrefFor={(v) => makeHref({ ...base, brand: toggle(state.brand, v) })}
      />
      <FacetGroup
        title="Category"
        options={facets.categories || []}
        selected={state.cat}
        hrefFor={(v) => makeHref({ ...base, cat: toggle(state.cat, v) })}
      />
      <FacetGroup
        title="Price"
        options={facets.price || []}
        selected={state.price ? [state.price] : []}
        hrefFor={(v) => makeHref({ ...base, price: state.price === v ? "" : v })}
      />
    </div>
  )
}

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; brand?: string; cat?: string; price?: string; page?: string }>
}) {
  const sp = await props.searchParams
  const state: State = {
    q: (sp.q || "").trim(),
    brand: (sp.brand || "").split(",").map((s) => s.trim()).filter(Boolean),
    cat: (sp.cat || "").split(",").map((s) => s.trim()).filter(Boolean),
    price: (sp.price || "").trim(),
    page: Math.max(1, parseInt(sp.page || "1", 10) || 1),
  }

  const data = await runSearch(state)
  const { products, facets, total } = data
  const pageSize = data.pageSize || 24
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = state.brand.length > 0 || state.cat.length > 0 || !!state.price

  // Active-filter chips (each links to the state with that filter removed).
  const chips: { label: string; href: string }[] = []
  for (const b of state.brand) chips.push({ label: b, href: makeHref({ ...state, page: 1, brand: state.brand.filter((x) => x !== b) }) })
  for (const c of state.cat) chips.push({ label: c, href: makeHref({ ...state, page: 1, cat: state.cat.filter((x) => x !== c) }) })
  if (state.price) {
    const pl = (facets.price || []).find((p) => p.value === state.price)?.label || state.price
    chips.push({ label: pl, href: makeHref({ ...state, page: 1, price: "" }) })
  }

  return (
    <div className="content-container py-12 small:py-16">
      <p className="text-aquora-accent text-xs font-semibold uppercase tracking-widest mb-2">Catalogue search</p>
      <h1 className="font-heading text-[32px] leading-tight text-aquora-ink mb-1">
        {state.q ? <>Results for “{state.q}”</> : "Search the catalogue"}
      </h1>
      <p className="text-aquora-muted mb-8">
        {state.q
          ? `${total.toLocaleString("en-AE")} product${total === 1 ? "" : "s"} found`
          : "Search across our full pool, spa, pond & fountain equipment range."}
      </p>

      {state.q && (
        <div className="flex flex-col small:flex-row gap-8 small:gap-10">
          {/* Sidebar — desktop */}
          {(facets.brands?.length || facets.categories?.length || facets.price?.length) ? (
            <aside className="hidden small:block w-60 shrink-0">
              <FilterPanel state={state} facets={facets} />
            </aside>
          ) : null}

          <div className="flex-1 min-w-0">
            {/* Mobile filters */}
            {(facets.brands?.length || facets.categories?.length || facets.price?.length) ? (
              <details className="small:hidden mb-6 rounded-large border border-black/10 p-4">
                <summary className="text-sm font-semibold text-aquora-ink cursor-pointer">Filters</summary>
                <div className="mt-4">
                  <FilterPanel state={state} facets={facets} />
                </div>
              </details>
            ) : null}

            {/* Active filter chips */}
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {chips.map((c) => (
                  <LocalizedClientLink
                    key={c.label}
                    href={c.href}
                    className="inline-flex items-center gap-1.5 text-xs font-medium bg-aquora-primary/10 text-aquora-primary rounded-full pl-3 pr-2 py-1 hover:bg-aquora-primary/20 transition-colors"
                  >
                    {c.label}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </LocalizedClientLink>
                ))}
                <LocalizedClientLink href={makeHref({ ...state, page: 1, brand: [], cat: [], price: "" })} className="text-xs text-aquora-muted underline hover:text-aquora-ink">
                  Clear all
                </LocalizedClientLink>
              </div>
            )}

            {products.length > 0 ? (
              <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-10">
                {products.map((p) => (
                  <li key={p.handle}>
                    <LocalizedClientLink href={`/products/${p.handle}`} className="group block">
                      <div className="aspect-square bg-aquora-surface rounded-large overflow-hidden border border-black/5">
                        {p.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-aquora-muted text-xs">No image</div>
                        )}
                      </div>
                      <h3 className="mt-3 text-sm text-aquora-ink leading-snug line-clamp-2 group-hover:text-aquora-primary transition-colors">{p.title}</h3>
                      {p.category && <p className="text-xs text-aquora-muted mt-1">{p.category}</p>}
                      {p.price != null && <p className="text-sm font-semibold text-aquora-ink mt-1">AED {Number(p.price).toLocaleString("en-AE")}</p>}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-large border border-black/5 bg-aquora-surface p-8 text-center">
                <p className="text-aquora-ink font-heading text-lg mb-1">No matches{hasFilters ? " with these filters" : ` for “${state.q}”`}.</p>
                <p className="text-aquora-muted text-sm">
                  {hasFilters ? (
                    <LocalizedClientLink href={makeHref({ ...state, page: 1, brand: [], cat: [], price: "" })} className="text-aquora-primary underline">Clear filters</LocalizedClientLink>
                  ) : (
                    <>Try a broader term, or ask <span className="text-aquora-primary font-medium">Aqua</span> (the assistant, bottom-right) to describe or photograph what you need.</>
                  )}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Search results pages">
                {state.page > 1 && (
                  <LocalizedClientLink href={makeHref({ ...state, page: state.page - 1 })} className="px-3 py-2 text-sm rounded-md border border-black/10 text-aquora-ink hover:border-aquora-primary hover:text-aquora-primary transition-colors">
                    ← Prev
                  </LocalizedClientLink>
                )}
                <span className="px-3 py-2 text-sm text-aquora-muted">
                  Page {state.page} of {totalPages}
                </span>
                {state.page < totalPages && (
                  <LocalizedClientLink href={makeHref({ ...state, page: state.page + 1 })} className="px-3 py-2 text-sm rounded-md border border-black/10 text-aquora-ink hover:border-aquora-primary hover:text-aquora-primary transition-colors">
                    Next →
                  </LocalizedClientLink>
                )}
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
