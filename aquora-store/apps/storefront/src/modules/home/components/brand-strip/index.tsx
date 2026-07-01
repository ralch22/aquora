import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { brands } from "@lib/aquora/brands"
import { brandLogo } from "@lib/aquora/brand-logos"

// Real brands Aquora stocks (from product metadata). Official logos (nominative use) render
// GRAYSCALE and reveal to full colour on hover; a brand with no sourced logo shows a clean
// wordmark. Presented as a thin, seamless auto-scrolling marquee — one tidy row that reads
// well on mobile (no more flex-wrap pile-up) and pauses on hover.
const FEATURED = [
  "Hayward", "Pentair", "AstralPool", "Zodiac", "Speck", "Dolphin",
  "Behncke", "Cepex", "DAB", "Polaris", "Elecro", "Atecpool",
]
const list = FEATURED.filter((n) => brands.some((b) => b.name === n))

function Mark({ name, dup }: { name: string; dup?: boolean }) {
  const logo = brandLogo(name)
  return (
    <LocalizedClientLink
      href={`/search?brand=${encodeURIComponent(name)}`}
      aria-label={dup ? undefined : `Shop ${name}`}
      aria-hidden={dup || undefined}
      tabIndex={dup ? -1 : undefined}
      className="group flex shrink-0 items-center px-7 small:px-9"
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={dup ? "" : `${name} logo`}
          loading="lazy"
          className="h-7 w-auto max-w-[120px] object-contain opacity-55 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 small:h-8"
        />
      ) : (
        <span className="whitespace-nowrap font-heading text-lg font-bold tracking-tight text-aquora-ink/55 transition-colors duration-300 group-hover:text-aquora-primary small:text-xl">
          {name}
        </span>
      )}
    </LocalizedClientLink>
  )
}

const BrandStrip = () => {
  return (
    <section className="border-y border-black/[0.06] bg-white">
      <div className="py-9 small:py-11">
        <p className="content-container text-center text-xs font-semibold uppercase tracking-[0.22em] text-aquora-muted">
          Genuine equipment from the brands the Gulf&apos;s pools are built on
        </p>
        {/* Full-bleed marquee with soft edge fades; the track holds the set twice for a
            seamless loop, second copy hidden from assistive tech. */}
        <div className="aq-marquee-pause relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          <div className="aq-marquee-track flex w-max items-center">
            {list.map((name) => (
              <Mark key={`a-${name}`} name={name} />
            ))}
            {list.map((name) => (
              <Mark key={`b-${name}`} name={name} dup />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default BrandStrip
