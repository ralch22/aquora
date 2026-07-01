import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { brands } from "@lib/aquora/brands"
import { brandLogo } from "@lib/aquora/brand-logos"

// Legitimate social proof: the real brands Aquora stocks (from product metadata). Official
// logos (nominative use) render GRAYSCALE and reveal to full colour on hover; a brand without
// a sourced logo falls back to a clean wordmark. No fabricated marks.
const FEATURED = [
  "Hayward", "Pentair", "AstralPool", "Zodiac", "Speck", "Dolphin",
  "Behncke", "Cepex", "DAB", "Polaris", "Elecro", "Atecpool",
]
const list = FEATURED.filter((n) => brands.some((b) => b.name === n))

const BrandStrip = () => {
  return (
    <section className="border-y border-black/[0.06] bg-white">
      <div className="content-container py-10 small:py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-aquora-muted">
          Genuine equipment from the brands the Gulf&apos;s pools are built on
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 small:gap-x-14">
          {list.map((name) => {
            const logo = brandLogo(name)
            return (
              <LocalizedClientLink
                key={name}
                href={`/search?brand=${encodeURIComponent(name)}`}
                aria-label={`Shop ${name}`}
                className="group flex items-center"
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={`${name} logo`}
                    loading="lazy"
                    className="h-7 w-auto max-w-[128px] object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 small:h-8"
                  />
                ) : (
                  <span className="font-heading text-lg font-bold tracking-tight text-aquora-ink/60 transition-colors duration-300 group-hover:text-aquora-primary small:text-xl">
                    {name}
                  </span>
                )}
              </LocalizedClientLink>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default BrandStrip
