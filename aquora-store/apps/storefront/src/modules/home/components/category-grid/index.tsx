import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { categories } from "@lib/aquora/categories"
import PremiumCta from "@modules/common/components/premium-cta"
import Reveal from "@modules/common/components/reveal"
import type { ReactNode } from "react"

/* ------------------------------------------------------------------ */
/*  Icon-led, photo-free CategoryGrid.                                 */
/*  Custom thin-line (1.5 stroke) SVGs — one per category handle —     */
/*  on calm, cohesive tiles. Linear/Stripe-tier. Server component.     */
/* ------------------------------------------------------------------ */

/* Single shared stroke geometry so every icon reads as one family.   */
const Ic = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="h-full w-full"
  >
    {children}
  </svg>
)

/* One icon per handle. Each is purpose-built for the category so the
   set feels designed, not clip-art. Default falls back to a droplet. */
const ICONS: Record<string, ReactNode> = {
  // ── Aspirational ────────────────────────────────────────────────
  "pool-pumps": (
    <Ic>
      <circle cx="11" cy="13" r="5.5" />
      <path d="M11 13 13.4 9" />
      <circle cx="11" cy="13" r="1.1" />
      <path d="M16 9.5h4.5M18 7.5v4" />
    </Ic>
  ),
  "pool-cleaners": (
    <Ic>
      <rect x="4" y="11" width="16" height="8.5" rx="3.2" />
      <path d="M8 11V8.5a4 4 0 0 1 8 0V11" />
      <path d="M8.5 15.5h7" />
    </Ic>
  ),
  "pool-heaters": (
    <Ic>
      <path d="M12 3c1.6 2.2 3 3.9 3 6.1A3 3 0 0 1 9 9.1C9 6.9 10.4 5.2 12 3Z" />
      <path d="M5 14.5c2.5-1 4.5-1 7 0s4.5 1 7 0" />
      <path d="M5 18.5c2.5-1 4.5-1 7 0s4.5 1 7 0" />
    </Ic>
  ),
  "pool-lighting": (
    <Ic>
      <path d="M9 14a5 5 0 1 1 6 0c-.8.6-1.2 1.3-1.3 2.3H10.3C10.2 15.3 9.8 14.6 9 14Z" />
      <path d="M10 19h4M10.5 21h3" />
    </Ic>
  ),
  "pool-filtration-systems": (
    <Ic>
      <path d="M4 6.5h16l-6 6.5v5.5l-4 2v-7.5L4 6.5Z" />
    </Ic>
  ),
  "water-treatment-equipment": (
    <Ic>
      <path d="M9 3h6M10 3v3.5L6.5 16.5A3 3 0 0 0 9.3 21h5.4a3 3 0 0 0 2.8-4.5L14 6.5V3" />
      <path d="M8.2 14.5h7.6" />
    </Ic>
  ),
  "hot-tubs-saunas-steam-generators-electric-sauna-heaters": (
    <Ic>
      <path d="M4 13h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
      <path d="M4 13V9a2 2 0 0 1 2-2h2" />
      <path d="M11 6.5c-.7.7-.7 1.3 0 2s.7 1.3 0 2M14.5 6.5c-.7.7-.7 1.3 0 2s.7 1.3 0 2" />
    </Ic>
  ),
  "waterfalls-counter-currents-systems-hydromassage-systems": (
    <Ic>
      <path d="M4 6h16" />
      <path d="M7 6v5M12 6v7M17 6v5" />
      <path d="M5 17c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0" />
      <path d="M5 20c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0" />
    </Ic>
  ),
  // ── Semi ────────────────────────────────────────────────────────
  "pool-covers": (
    <Ic>
      <rect x="3.5" y="7" width="17" height="10" rx="2.5" />
      <path d="M3.5 11.5h17M3.5 14h17" />
      <path d="M9 7v10M15 7v10" />
    </Ic>
  ),
  "fountain-nozzles": (
    <Ic>
      <path d="M12 21c-3 0-5-2-5-5 0-3 3-6 5-13 2 7 5 10 5 13 0 3-2 5-5 5Z" />
      <path d="M12 7v3" />
    </Ic>
  ),
  "pond-lighting": (
    <Ic>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 3v2M12 15v2M5 10h2M17 10h2M7 5l1.4 1.4M15.6 13.6 17 15" />
      <path d="M5 20c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0" />
    </Ic>
  ),
  // ── Utility ─────────────────────────────────────────────────────
  "pvc-pipes-and-fittings": (
    <Ic>
      <path d="M4 8h7a3 3 0 0 1 3 3v9" />
      <path d="M2.5 6.5h3v3h-3zM12.5 18.5h3v3h-3z" />
      <path d="M14 11h6" />
    </Ic>
  ),
  "pool-and-pond-lining-waterproofing": (
    <Ic>
      <path d="M4 7c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.4 0" />
      <path d="M4 7v10c1.6 1 3.2 1 4.8 0s3.2-1 4.8 0 3.2 1 4.4 0V7" />
      <path d="M8.8 7v10M13.6 7v10" />
    </Ic>
  ),
  "pool-shell-equipment": (
    <Ic>
      <path d="M3.5 7.5h17M3.5 7.5 6 19a2 2 0 0 0 2 1.6h8A2 2 0 0 0 18 19l2.5-11.5" />
      <path d="M9 11.5v5M15 11.5v5M12 11.5v5" />
    </Ic>
  ),
  "pump-parts": (
    <Ic>
      <path d="M12 9.2 13.6 7l2.5 1-.3 2.7 2.2 1.6-1.2 2.4 1.2 2.4-2.2 1.6.3 2.7-2.5 1L12 20.4 10.4 22.6l-2.5-1 .3-2.7-2.2-1.6 1.2-2.4-1.2-2.4 2.2-1.6-.3-2.7 2.5-1L12 9.2Z" />
      <circle cx="12" cy="14.8" r="2.6" />
      <path d="M12 9.2V3" />
    </Ic>
  ),
  "ladders-and-handrails": (
    <Ic>
      <path d="M8 3v15a3 3 0 0 0 6 0M16 3v15" />
      <path d="M8 7h8M8 11h8M8 15h8" />
      <path d="M3 20c1.4 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0 2.6 1 4 0" />
    </Ic>
  ),
}

const Droplet = (
  <Ic>
    <path d="M12 21c-3.3 0-6-2.6-6-6 0-3.6 4-7.4 6-12 2 4.6 6 8.4 6 12 0 3.4-2.7 6-6 6Z" />
  </Ic>
)

/* Curated display order — aspirational first, utility last. Anything
   not listed still renders (appended), so all 16 stay reachable. */
const ORDER = [
  "pool-pumps",
  "pool-cleaners",
  "pool-heaters",
  "pool-lighting",
  "pool-filtration-systems",
  "water-treatment-equipment",
  "hot-tubs-saunas-steam-generators-electric-sauna-heaters",
  "waterfalls-counter-currents-systems-hydromassage-systems",
  "pool-covers",
  "fountain-nozzles",
  "pond-lighting",
  "pvc-pipes-and-fittings",
  "pool-and-pond-lining-waterproofing",
  "pool-shell-equipment",
  "pump-parts",
  "ladders-and-handrails",
]

/* Short, scannable tile labels — the catalogue names run long and break
   the grid rhythm. Falls back to the real category name. */
const LABELS: Record<string, string> = {
  "hot-tubs-saunas-steam-generators-electric-sauna-heaters": "Spas, Saunas & Steam",
  "waterfalls-counter-currents-systems-hydromassage-systems": "Waterfalls & Hydromassage",
  "pool-and-pond-lining-waterproofing": "Lining & Waterproofing",
  "water-treatment-equipment": "Water Treatment",
  "pool-filtration-systems": "Filtration Systems",
  "fountain-nozzles": "Fountain Nozzles",
}

/* One-line, factual merchandising blurb for the featured (hero) tile. Grounded
   in the brands the catalogue actually carries — no invented claims. */
const TAGLINES: Record<string, string> = {
  "pool-pumps": "Variable-speed circulation from Hayward, Pentair, Speck & Zodiac.",
  "pool-cleaners": "Robotic & automatic cleaners, led by Dolphin.",
  "pool-heaters": "Inverter heat pumps and electric heaters.",
  "pool-lighting": "LED pool, fountain & feature lighting.",
}

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg className={`h-4 w-4 ${className}`} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const CategoryGrid = () => {
  const byHandle = new Map<string, { handle: string; name: string }>(
    categories.map((c) => [c.handle, c])
  )
  const ordered = [
    ...ORDER.map((h) => byHandle.get(h)).filter(Boolean),
    ...categories.filter((c) => !ORDER.includes(c.handle)),
  ] as { handle: string; name: string }[]
  const feature = ordered[0]
  const rest = ordered.slice(1)

  return (
    <section className="bg-white">
      <div className="content-container py-20 small:py-28">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-12 flex flex-col gap-6 small:mb-16 small:flex-row small:items-end small:justify-between">
          <Reveal className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-aquora-primary">
              <span className="h-px w-6 bg-aquora-accent" />
              The catalogue
            </span>
            <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.75rem] small:leading-[1.05]">
              Shop by category
            </h2>
            <p className="mt-4 text-base leading-relaxed text-aquora-muted">
              Sixteen complete equipment lines for pools, spas, ponds and
              fountains — every part specified for Gulf water and climate.
            </p>
          </Reveal>
          <Reveal delay={120} className="shrink-0">
            <PremiumCta href="/store" variant="ink">
              Browse all products
            </PremiumCta>
          </Reveal>
        </div>

        {/* ── Icon bento: 1 teal feature anchor + uniform tiles + catalogue cell ── */}
        <Reveal className="grid grid-cols-2 gap-3 small:grid-cols-3 small:gap-4 lg:grid-cols-4">
          {/* Feature anchor — the aspirational lead (Pool Pumps), not a SKU-count
              utility line. Deep teal, gold icon, factual tagline, faint water motif. */}
          {feature && (
            <LocalizedClientLink
              href={`/categories/${feature.handle}`}
              className="group relative col-span-2 row-span-2 flex flex-col justify-between overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-aquora-secondary to-aquora-primary p-6 text-white shadow-[0_30px_60px_-34px_rgba(10,58,66,0.7)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 small:p-8"
            >
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 text-white/[0.06]"
                preserveAspectRatio="none"
                viewBox="0 0 400 220"
                fill="none"
              >
                <path d="M0 150 Q 100 118 200 150 T 400 150" stroke="currentColor" strokeWidth="1.5" />
                <path d="M0 178 Q 100 146 200 178 T 400 178" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <div className="relative flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-[1rem] bg-white/10 text-aquora-accent ring-1 ring-white/15 small:h-16 small:w-16">
                  <span className="h-7 w-7 small:h-8 small:w-8">{ICONS[feature.handle] ?? Droplet}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-aquora-accent">
                  <span className="h-px w-5 bg-aquora-accent" />
                  Most shopped
                </span>
              </div>
              <div className="relative mt-6">
                <h3 className="font-heading text-2xl font-bold tracking-tight small:text-[2rem] small:leading-[1.08]">
                  {LABELS[feature.handle] ?? feature.name}
                </h3>
                {TAGLINES[feature.handle] && (
                  <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/70">
                    {TAGLINES[feature.handle]}
                  </p>
                )}
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Explore range
                  <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </LocalizedClientLink>
          )}

          {/* Uniform icon tiles — one cohesive family, no ragged photos. */}
          {rest.map((category) => (
            <LocalizedClientLink
              key={category.handle}
              href={`/categories/${category.handle}`}
              className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-aquora-ink/[0.07] bg-aquora-surface/40 p-5 transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-aquora-primary/30 hover:bg-white small:min-h-[176px] small:p-6"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-gradient-to-b from-aquora-primary/[0.04] to-aquora-primary/[0.09] opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-hover:opacity-100"
              />
              <span className="relative grid h-11 w-11 place-items-center rounded-[0.85rem] bg-white text-aquora-primary ring-1 ring-aquora-ink/[0.06] transition-colors duration-500 group-hover:text-aquora-secondary small:h-12 small:w-12">
                <span className="h-[22px] w-[22px] small:h-6 small:w-6">
                  {ICONS[category.handle] ?? Droplet}
                </span>
              </span>
              <div className="relative mt-4 flex items-end justify-between gap-2">
                <h3 className="font-heading text-[0.95rem] font-semibold leading-snug tracking-tight text-aquora-ink transition-colors duration-300 group-hover:text-aquora-primary small:text-base">
                  {LABELS[category.handle] ?? category.name}
                </h3>
                <span className="mb-0.5 translate-x-1 text-aquora-accent opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:opacity-100">
                  <Arrow className="h-4 w-4" />
                </span>
              </div>
            </LocalizedClientLink>
          ))}

          {/* Catalogue cell — fills the grid evenly + a clean route to /store. */}
          <LocalizedClientLink
            href="/store"
            className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-aquora-secondary/15 bg-aquora-secondary/[0.06] p-5 transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:bg-aquora-secondary/[0.1] small:min-h-[176px] small:p-6"
          >
            <span className="grid h-11 w-11 place-items-center rounded-[0.85rem] bg-aquora-secondary text-white small:h-12 small:w-12">
              <span className="h-[22px] w-[22px] small:h-6 small:w-6">
                <Ic>
                  <rect x="4" y="4" width="7" height="7" rx="1.6" />
                  <rect x="13" y="4" width="7" height="7" rx="1.6" />
                  <rect x="4" y="13" width="7" height="7" rx="1.6" />
                  <rect x="13" y="13" width="7" height="7" rx="1.6" />
                </Ic>
              </span>
            </span>
            <div className="mt-4 flex items-end justify-between gap-2">
              <h3 className="font-heading text-[0.95rem] font-semibold leading-snug tracking-tight text-aquora-secondary small:text-base">
                All products
              </h3>
              <span className="text-aquora-secondary">
                <Arrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </LocalizedClientLink>
        </Reveal>
      </div>
    </section>
  )
}

export default CategoryGrid
