import { Metadata } from "next"

import { brand } from "@lib/aquora/brand"
import ImageBanner from "@modules/common/components/image-banner"
import PageHeader from "../blog/_lib/page-header"
import { renderContentMarkdown } from "../blog/_lib/markdown"

export const metadata: Metadata = {
  title: `About Aquora — ${brand.tagline}`,
  description:
    "Aquora is the Gulf's premium source for genuinely engineered pool, spa, pond and fountain equipment — designed in Dubai, supported across the UAE and wider GCC.",
}

export default async function AboutPage() {
  const html = await renderContentMarkdown("about.md")

  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="About Aquora"
        title="About Aquora"
        subtitle={brand.tagline}
        variant="teal"
      />

      <section className="content-container py-16 small:py-24">
        <div className="mb-14">
          <ImageBanner
            image="/images/brand/editorial-install.webp"
            imageAlt="The Aquora team installing pool equipment"
            eyebrow="Engineering-led, since day one"
            headline="Specified right, supported for life"
            text="We size, supply and stand behind genuine equipment — so your pool runs better and lasts longer across Gulf conditions."
            cta={{ label: "Explore our services", href: "/services" }}
            secondaryCta={{ label: "Shop the range", href: "/store" }}
            variant="category"
            align="left"
          />
        </div>
        <article
          className="prose prose-headings:font-heading prose-headings:tracking-tight prose-h1:hidden prose-lg max-w-none prose-a:text-aquora-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </div>
  )
}
