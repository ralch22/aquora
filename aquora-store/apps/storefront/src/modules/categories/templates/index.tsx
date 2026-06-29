import { notFound } from "next/navigation"

import InteractiveLink from "@modules/common/components/interactive-link"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import RelatedCategories from "@modules/categories/components/related-categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { BrandFilters, PriceRange } from "@lib/util/product-facet-filters"
import { categories as aquoraCategories } from "@lib/aquora/categories"
import ImageBanner from "@modules/common/components/image-banner"
import ProductBanner, { type ProductBannerProps } from "@modules/common/components/product-banner"

const GCS = "https://storage.googleapis.com/emerge-aquora-products"
// Category-specific PRODUCT banners (real product photos) for the highest-intent categories.
const CATEGORY_PRODUCT_BANNERS: Record<string, ProductBannerProps> = {
  "pool-cleaners": {
    image: `${GCS}/dolphin-scoop-smart-robotic-swimming-pool-cleaner-12-15-m/0.webp`,
    imageAlt: "Robotic pool cleaner",
    eyebrow: "Hands-off cleaning",
    headline: "Let a robot do the scrubbing",
    text: "Robotic cleaners scrub, vacuum and filter on their own — independent of your pump. The easy way to a spotless pool.",
    cta: { label: "Shop robotic cleaners", href: "/categories/pool-cleaners" },
    secondaryCta: { label: "Which one's right?", href: "/guides/how-to-choose-a-robotic-cleaner" },
    imageSide: "right",
  },
  "pool-heaters": {
    image: `${GCS}/behncke-ewt-80-71-electric-heater-with-control-thermostat-and-flow-switch-for-swimming-pool-9-kw/0.webp`,
    imageAlt: "Pool heater",
    eyebrow: "Swim longer",
    headline: "Warm water, every season",
    text: "Heat pumps and electric heaters to extend your swim season — sized to your pool and efficient to run.",
    cta: { label: "Shop heating", href: "/categories/pool-heaters" },
    secondaryCta: { label: "Heater buying guide", href: "/guides/how-to-choose-a-pool-heater" },
    imageSide: "right",
  },
  "pool-pumps": {
    image: `${GCS}/speck-badu-gamma-eco-vs-pump-for-pool-1-40-kw-24-m3h-2-hp/0.webp`,
    imageAlt: "Variable-speed pool pump",
    eyebrow: "The heart of your pool",
    headline: "Variable-speed pumps that pay for themselves",
    text: "Run slow and quiet for everyday filtering — cutting running costs by up to 80% versus a single-speed pump.",
    cta: { label: "Shop pumps", href: "/categories/pool-pumps" },
    secondaryCta: { label: "Pump buying guide", href: "/guides/how-to-choose-a-pool-pump" },
    imageSide: "right",
  },
}

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  brandFilters,
  priceRange,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  brandFilters?: BrandFilters
  priceRange?: PriceRange
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <>
      <div className="content-container pt-6">
        {CATEGORY_PRODUCT_BANNERS[category.handle] ? (
          <ProductBanner {...CATEGORY_PRODUCT_BANNERS[category.handle]} />
        ) : (
          <ImageBanner
            image="/images/brand/editorial-equipment.webp"
            imageAlt="Genuine, engineered pool equipment delivered across the UAE"
            eyebrow="Genuine & supported"
            headline="Engineered to last, delivered fast"
            text="Authentic equipment with manufacturer warranty — free delivery over AED 500. Not sure what you need?"
            cta={{ label: "Get help choosing", href: "/pool-care" }}
            variant="strip"
            align="left"
          />
        )}
      </div>
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        sortBy={sort}
        data-testid="sort-by-container"
        hideOptionsPicker
      />
      <div className="w-full">
        <div className="flex flex-row mb-8 text-2xl-semi gap-4">
          {parents &&
            parents.map((parent) => (
              <span key={parent.id} className="text-aquora-muted">
                <LocalizedClientLink
                  className="mr-4 hover:text-black"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                /
              </span>
            ))}
          <h1 data-testid="category-page-title">{category.name}</h1>
        </div>
        {(() => {
          const intro =
            category.description ||
            aquoraCategories.find((c) => c.handle === category.handle)?.description
          return intro ? (
            <div className="mb-8 max-w-3xl text-base leading-relaxed text-aquora-muted">
              <p>{intro}</p>
            </div>
          ) : null
        })()}
        {(() => {
          // Contextual entry to the sizing tool on the categories where it actually helps buyers choose.
          const sizingHandles = new Set([
            "pool-pumps",
            "pool-filtration-systems",
            "sand-filters",
            "pool-heaters",
            "water-treatment-equipment",
          ])
          const show =
            sizingHandles.has(category.handle) ||
            parents.some((p) => sizingHandles.has(p.handle))
          return show ? (
            <LocalizedClientLink
              href="/pool-sizing-guide"
              className="group mb-8 flex max-w-3xl items-center gap-4 rounded-[1.4rem] border border-aquora-primary/15 bg-aquora-primary/[0.04] p-4 transition-colors hover:bg-aquora-primary/[0.07]"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-aquora-primary/10 text-aquora-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 7h18M3 12h18M3 17h18M7 4v16" />
                </svg>
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-aquora-ink">Not sure what size you need?</span>
                <span className="block text-sm text-aquora-muted">Use our pool sizing calculator to match equipment to your pool.</span>
              </span>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-aquora-primary transition-transform group-hover:translate-x-0.5" aria-hidden>
                <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
              </svg>
            </LocalizedClientLink>
          ) : null
        })()}
        {(() => {
          // Contextual entry to the water-balancing tools on chemical categories.
          const chemHandles = new Set([
            "chlorine",
            "ph-balance",
            "anti-algae",
            "flocculant",
            "tester",
            "chemicals-for-spa",
            "chlorine-free",
          ])
          const show =
            chemHandles.has(category.handle) ||
            parents.some((p) => chemHandles.has(p.handle))
          return show ? (
            <div className="mb-8 flex max-w-3xl flex-col gap-3 rounded-[1.4rem] border border-aquora-primary/15 bg-aquora-primary/[0.04] p-4 small:flex-row small:items-center">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-aquora-primary/10 text-aquora-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 3h6M10 3v5l-4 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-9V3M7 14h10" />
                </svg>
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-aquora-ink">Not sure how much to add?</span>
                <span className="block text-sm text-aquora-muted">Get exact doses with our calculator, or diagnose a problem first.</span>
              </span>
              <span className="flex shrink-0 gap-2">
                <LocalizedClientLink href="/pool-dosing-calculator" className="inline-flex items-center justify-center rounded-full bg-aquora-primary px-4 py-2 text-xs font-semibold text-white transition active:scale-[0.98]">
                  Dosing calculator
                </LocalizedClientLink>
                <LocalizedClientLink href="/pool-problem-solver" className="inline-flex items-center justify-center rounded-full border border-aquora-primary/30 px-4 py-2 text-xs font-semibold text-aquora-primary transition hover:bg-aquora-primary/5">
                  Problem solver
                </LocalizedClientLink>
              </span>
            </div>
          ) : null
        })()}
        {category.category_children && (
          <div className="mb-8 text-base-large">
            <ul className="grid grid-cols-1 gap-2">
              {category.category_children?.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/categories/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Inline (not a streamed <Suspense>) — deferred Suspense boundaries don't get React's
            `$RC` completion script in this deployment, leaving the grid stuck behind its skeleton.
            Resolving inline (like the homepage shelves) makes it paint AND hydrate. */}
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          categoryId={category.id}
          countryCode={countryCode}
          optionValueIds={optionValueIds}
          brandFilters={brandFilters}
          priceRange={priceRange}
        />
        <RelatedCategories handle={category.handle} />
      </div>
    </div>
    </>
  )
}
