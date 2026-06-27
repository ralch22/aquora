import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { brands } from "@lib/aquora/brands"

// Legitimate social proof: the real brands Aquora stocks (from product metadata). No
// fabricated logos — clean wordmarks, each linking to a filtered search.
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
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {list.map((name) => (
            <LocalizedClientLink
              key={name}
              href={`/search?brand=${encodeURIComponent(name)}`}
              className="font-heading text-lg font-bold tracking-tight text-aquora-ink/35 transition-colors duration-300 hover:text-aquora-primary small:text-xl"
            >
              {name}
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BrandStrip
