import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import BrandStrip from "@modules/home/components/brand-strip"
import ProductShelf from "@modules/home/components/product-shelf"
import ShopByNeed from "@modules/home/components/shop-by-need"
import CategoryGrid from "@modules/home/components/category-grid"
import BrandStory from "@modules/home/components/brand-story"
import StatsBand from "@modules/home/components/stats-band"
import EditorialSections from "@modules/home/components/editorial-sections"
import GuidesResources from "@modules/home/components/guides-resources"
import AskAqua from "@modules/home/components/ask-aqua"
import TrustBand from "@modules/home/components/trust-band"
import Reveal from "@modules/common/components/reveal"

export const metadata: Metadata = {
  title: "Aquora — Pool, Spa & Fountain Equipment in the UAE",
  description:
    "Aquora supplies premium, genuinely engineered pool, spa, pond and fountain equipment across Dubai and the GCC — pumps, filtration, heating, automation and expert technical support.",
  openGraph: {
    title: "Aquora — Engineered Pool, Spa & Fountain Equipment",
    description:
      "Genuinely engineered pool, spa, pond and fountain equipment, stocked and supported across the UAE & GCC.",
    images: [{ url: "/images/brand/og.webp", width: 1200, height: 675 }],
    type: "website",
  },
}

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  return (
    <>
      <Hero />
      <BrandStrip />
      <Reveal>
        <ProductShelf
          countryCode={countryCode}
          handle="pool-cleaners"
          eyebrow="In the spotlight"
          title="Robotic cleaners & most-wanted gear"
        />
      </Reveal>
      <Reveal>
        <ShopByNeed />
      </Reveal>
      <CategoryGrid />
      <Reveal>
        <ProductShelf
          countryCode={countryCode}
          handle="pool-pumps"
          eyebrow="Circulation"
          title="Pumps that keep water moving"
        />
      </Reveal>
      <Reveal>
        <BrandStory />
      </Reveal>
      <Reveal>
        <StatsBand />
      </Reveal>
      <Reveal>
        <EditorialSections />
      </Reveal>
      <Reveal>
        <GuidesResources />
      </Reveal>
      <Reveal>
        <AskAqua />
      </Reveal>
      <Reveal>
        <TrustBand />
      </Reveal>
    </>
  )
}
