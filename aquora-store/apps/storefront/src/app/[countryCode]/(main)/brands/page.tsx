import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageBanner from "@modules/common/components/image-banner"
import { brands, brandSlug } from "@lib/aquora/brands"
import { brandLogo } from "@lib/aquora/brand-logos"

export const metadata: Metadata = {
  title: "Brands — Aquora",
  description: "Shop genuine pool, spa, pond and fountain equipment by brand at Aquora.",
}

export default function BrandsPage() {
  return (
    <div className="content-container py-12 small:py-16">
      <div className="mb-10">
        <ImageBanner
          image="/images/brand/editorial-equipment.webp"
          imageAlt="Genuine pool equipment from the brands the Gulf trusts"
          eyebrow="Authentic & supported"
          headline="The brands the Gulf's pools are built on"
          text="Hayward, Pentair, AstralPool, Zodiac, Speck and more — genuine, warrantied and delivered free over AED 500."
          cta={{ label: "Browse the store", href: "/store" }}
          variant="category"
          align="left"
        />
      </div>
      <p className="text-aquora-accent text-xs font-semibold uppercase tracking-widest mb-2">The brands we carry</p>
      <h1 className="font-heading text-[32px] leading-tight text-aquora-ink mb-2">Shop by brand</h1>
      <p className="text-aquora-muted mb-10 max-w-2xl">
        Genuine equipment from {brands.length}+ leading pool, spa and water-feature manufacturers — supplied, installed and supported across the UAE &amp; the GCC.
      </p>
      <ul className="aq-grid-in grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
        {brands.map((b) => {
          const logo = brandLogo(b.name)
          return (
            <li key={b.name}>
              <LocalizedClientLink
                href={`/brands/${brandSlug(b.name)}`}
                aria-label={`Shop ${b.name}`}
                className="group flex h-28 flex-col items-center justify-center gap-2.5 rounded-large border border-black/5 bg-white px-4 py-4 hover:border-aquora-primary hover:shadow-sm transition-all duration-150"
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={`${b.name} logo`}
                    loading="lazy"
                    className="h-9 w-auto max-w-[120px] object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="font-heading text-base font-semibold text-aquora-ink/70 group-hover:text-aquora-primary transition-colors duration-150">
                    {b.name}
                  </span>
                )}
                <span className="text-[11px] text-aquora-muted">{b.count} products</span>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
