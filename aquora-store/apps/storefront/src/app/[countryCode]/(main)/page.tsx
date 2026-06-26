import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import StatsBand from "@modules/home/components/stats-band"
import CategoryGrid from "@modules/home/components/category-grid"
import ValueProps from "@modules/home/components/value-props"
import EditorialSections from "@modules/home/components/editorial-sections"
import TrustBand from "@modules/home/components/trust-band"
import Reveal from "@modules/common/components/reveal"

export const metadata: Metadata = {
  title: "Aquora — Pool, Spa & Fountain Equipment in the UAE",
  description:
    "Aquora supplies premium, genuinely engineered pool, spa, pond and fountain equipment across Dubai and the GCC — pumps, filtration, heating, automation and expert technical support.",
}

export default async function Home() {
  return (
    <>
      <Hero />
      <Reveal>
        <StatsBand />
      </Reveal>
      <CategoryGrid />
      <Reveal>
        <ValueProps />
      </Reveal>
      <Reveal>
        <EditorialSections />
      </Reveal>
      <Reveal>
        <TrustBand />
      </Reveal>
    </>
  )
}
