import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageBanner from "@modules/common/components/image-banner"
import { brands } from "@lib/aquora/brands"
import { buildAlternates } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params
  return {
    title: "Brands — Aquora",
    description: "Shop genuine pool, spa, pond and fountain equipment by brand at Aquora.",
    alternates: await buildAlternates(countryCode, "brands"),
  }
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
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
        {brands.map((b) => (
          <li key={b.name}>
            <LocalizedClientLink
              href={`/search?q=${encodeURIComponent(b.name)}`}
              className="group flex items-center justify-between rounded-large border border-black/5 bg-white px-5 py-4 hover:border-aquora-primary hover:shadow-sm transition-all duration-150"
            >
              <span className="font-heading text-aquora-ink group-hover:text-aquora-primary transition-colors duration-150">{b.name}</span>
              <span className="text-xs text-aquora-muted">{b.count}</span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
