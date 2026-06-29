import { Metadata } from "next"
import { notFound } from "next/navigation"

// Rendered on demand so the build never depends on the backend being reachable at build
// time (mirrors categories/[...category]/page.tsx). generateStaticParams still enumerates
// the brand routes for the route manifest + sitemap parity.
export const dynamic = "force-dynamic"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageBanner from "@modules/common/components/image-banner"
import { getProductVideo } from "@lib/aquora/videos"
import { Pagination } from "@modules/store/components/pagination"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { brands, brandSlug, findBrandBySlug } from "@lib/aquora/brands"
import { buildAlternates } from "@lib/util/seo"
import { StoreRegion } from "@medusajs/types"

const BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type BrandCard = {
  handle: string
  title: string
  thumbnail: string | null
  category: string | null
  price: number | null
}

type Props = {
  params: Promise<{ brand: string; countryCode: string }>
  searchParams: Promise<{ page?: string }>
}

// Fetch this brand's products via the backend browse endpoint, which filters the full
// catalogue by the `brand` facet (derived from product metadata.brand) — the same path the
// faceted /search?brand= page uses. Paginated, with an exact total for the brand.
async function fetchBrandProducts(
  brand: string,
  page: number
): Promise<{ products: BrandCard[]; total: number; pageSize: number }> {
  const empty = { products: [], total: 0, pageSize: 24 }
  const p = new URLSearchParams({ q: "", brand, page: String(page) })
  try {
    const r = await fetch(`${BACKEND}/store/search?${p.toString()}`, {
      headers: { "x-publishable-api-key": KEY },
      cache: "no-store",
    })
    if (!r.ok) return empty
    const data = await r.json()
    return {
      products: (data.products as BrandCard[]) || [],
      total: data.total || 0,
      pageSize: data.pageSize || 24,
    }
  } catch {
    return empty
  }
}

export async function generateStaticParams() {
  let countryCodes: string[] = []
  try {
    const regions = await listRegions()
    countryCodes = (regions
      ?.map((r: StoreRegion) => r.countries?.map((c) => c.iso_2))
      .flat()
      .filter(Boolean) as string[]) || []
  } catch {}
  if (!countryCodes.length) {
    countryCodes = [process.env.NEXT_PUBLIC_DEFAULT_REGION || "ae"]
  }
  return countryCodes.flatMap((countryCode) =>
    brands.map((b) => ({ countryCode, brand: brandSlug(b.name) }))
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { brand: slug, countryCode } = await props.params
  const brand = findBrandBySlug(slug)
  if (!brand) {
    return { title: "Brand not found — Aquora" }
  }
  const base = getBaseURL()
  const url = `${base}/${countryCode}/brands/${slug}`
  const title = `${brand.name} Pool & Spa Equipment UAE — ${brand.count} products | Aquora`
  const description = `Shop ${brand.count} genuine ${brand.name} pool, spa and water-feature products at Aquora — supplied and supported across the UAE & GCC. Free delivery over AED 500.`.slice(
    0,
    160
  )
  return {
    title,
    description,
    alternates: await buildAlternates(`/brands/${slug}`, countryCode),
    openGraph: { title, description, url, type: "website" },
  }
}

export default async function BrandPage(props: Props) {
  const { brand: slug, countryCode } = await props.params
  const brand = findBrandBySlug(slug)
  if (!brand) {
    notFound()
  }

  const sp = await props.searchParams
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1)

  const { products, total, pageSize } = await fetchBrandProducts(brand.name, page)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const offset = (page - 1) * pageSize

  const base = getBaseURL()
  const url = `${base}/${countryCode}/brands/${slug}`

  // CollectionPage + BreadcrumbList structured data (follows product-jsonld). Only real,
  // backend-derived data: brand name, product count and the products actually listed.
  const collection = {
    "@context": "https://schema.org/",
    "@type": "CollectionPage",
    name: `${brand.name} Pool & Spa Equipment`,
    description: `Genuine ${brand.name} pool, spa and water-feature equipment at Aquora.`,
    url,
    isPartOf: { "@type": "WebSite", name: "Aquora", url: base },
    ...(total
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: total,
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: offset + i + 1,
              url: `${base}/${countryCode}/products/${p.handle}`,
              name: p.title,
            })),
          },
        }
      : {}),
  }
  const breadcrumb = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Brands", item: `${base}/${countryCode}/brands` },
      { "@type": "ListItem", position: 2, name: brand.name },
    ],
  }

  return (
    <div className="content-container py-12 small:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([collection, breadcrumb]) }}
      />

      <div className="mb-8">
        <ImageBanner
          image="/images/brand/editorial-equipment.webp"
          imageAlt={`Genuine ${brand.name} pool and spa equipment`}
          eyebrow="Genuine & supported"
          headline={`${brand.name} — supplied and supported across the UAE`}
          text="Authentic, warrantied equipment delivered free over AED 500."
          cta={{ label: "All brands", href: "/brands" }}
          variant="category"
          align="left"
        />
      </div>

      {/* Breadcrumb trail (visible, mirrors the JSON-LD) */}
      <nav className="mb-3 text-xs text-aquora-muted" aria-label="Breadcrumb">
        <LocalizedClientLink href="/brands" className="hover:text-aquora-ink transition-colors">
          Brands
        </LocalizedClientLink>
        <span className="mx-1.5">/</span>
        <span className="text-aquora-ink">{brand.name}</span>
      </nav>

      <h1 className="font-heading text-[32px] leading-tight text-aquora-ink mb-2">
        {brand.name} pool &amp; spa equipment
      </h1>
      <p className="text-aquora-muted mb-10 max-w-2xl">
        {total > 0
          ? `${total.toLocaleString("en-AE")} genuine ${brand.name} product${total === 1 ? "" : "s"} — supplied, installed and supported across the UAE & the GCC.`
          : `Genuine ${brand.name} equipment — supplied, installed and supported across the UAE & the GCC.`}
      </p>

      {products.length > 0 ? (
        <>
          {/* Inline grid — NOT wrapped in a streamed <Suspense> (deferred-suspense bug keeps
              funnel-critical grids hidden in this deploy). */}
          <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8" data-testid="brand-products-list">
            {products.map((p) => (
              <li key={p.handle}>
                <LocalizedClientLink href={`/products/${p.handle}`} className="group block">
                  <div className="relative aspect-square bg-aquora-surface rounded-large overflow-hidden border border-black/5">
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-aquora-muted text-xs">No image</div>
                    )}
                    {getProductVideo(p.handle) && (
                      <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-aquora-secondary/85 py-0.5 pl-1.5 pr-2 text-[10px] font-semibold text-white backdrop-blur">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Video
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm text-aquora-ink leading-snug line-clamp-2 group-hover:text-aquora-primary transition-colors">
                    {p.title}
                  </h3>
                  {p.category && <p className="text-xs text-aquora-muted mt-1">{p.category}</p>}
                  {p.price != null && (
                    <p className="text-sm font-semibold text-aquora-ink mt-1">
                      AED {Number(p.price).toLocaleString("en-AE")}
                    </p>
                  )}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} data-testid="brand-pagination" />}
        </>
      ) : (
        <div className="rounded-large border border-black/5 bg-aquora-surface p-8 text-center">
          <p className="text-aquora-ink font-heading text-lg mb-1">{brand.name} products are loading.</p>
          <p className="text-aquora-muted text-sm">
            Browse the full range in the{" "}
            <LocalizedClientLink href={`/search?brand=${encodeURIComponent(brand.name)}`} className="text-aquora-primary underline">
              catalogue
            </LocalizedClientLink>
            , or ask <span className="text-aquora-primary font-medium">Aqua</span> (the assistant, bottom-right).
          </p>
        </div>
      )}
    </div>
  )
}
