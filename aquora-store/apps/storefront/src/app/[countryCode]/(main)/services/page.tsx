import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { brand, contact } from "@lib/aquora/brand"
import ImageBanner from "@modules/common/components/image-banner"
import PageHeader from "../blog/_lib/page-header"
import { readContentMarkdown } from "../blog/_lib/markdown"
import { marked } from "marked"

export const metadata: Metadata = {
  title: "Design, Supply & Installation — Aquora",
  description:
    "Aquora's engineers design, supply and install complete pool, spa, pond and fountain systems across the UAE and GCC — from hydraulic design and equipment specification to commissioning and maintenance.",
}

/**
 * Authored fallback that mirrors the intended services brief. Used when the
 * prepared services.md does not contain a real article (it currently holds an
 * authoring note rather than the page body). Renders identically to the
 * markdown path so the page is always premium and on-brand.
 */
const SERVICES_FALLBACK = `## Consultation & Hydraulic Design

Every Aquora project starts with engineering, not a price list. Our team carries out a full site survey and works from first principles — calculating pool turnover, pipe sizing and total pump head so the system is specified for how your water actually behaves in the Gulf climate. Whether it is a single villa pool or a hospitality landmark, you receive a design that balances hydraulics, filtration, chemistry and energy from the outset.

## Equipment Specification

We specify complete schedules from the Aquora house product lines — variable-speed pumps, sand, cartridge and glass filtration, inverter heating, automated dosing and precise LED control. Each component is sized for hard Gulf water, high ambient heat and year-round operation, and matched to work as one system rather than a set of parts bolted together. The result is quieter plant rooms, lower running costs and water that holds its quality through summer.

## Supply

All equipment is supplied through proper channels with genuine warranties, stocked locally in the UAE for fast dispatch and priced transparently in AED. Villa owners, contractors and consultants all buy from the same dependable inventory, with trade pricing and priority allocation available for registered accounts.

## Installation & Commissioning

Our certified teams handle full installation, hydraulic balancing and commissioning. Every system is pressure-tested, water-balance verified and handed over with documentation, so it runs correctly from day one and is serviceable for whoever maintains it next. Prefer to use your own contractor? We provide technical guidance and oversight to keep the installation on specification.

## Fountains & Water Features

From courtyard features to choreographed musical "dancing" fountains, we design and install architectural water features that synchronise water, colour and sound. Nozzles, pumps, lighting and controls are specified together and corrosion-rated for continuous Middle East operation.

## Maintenance Contracts

Keep systems running quietly and efficiently with scheduled Aquora maintenance — from a single villa to a multi-site hospitality portfolio. Genuine spares held in-country mean a breakdown is a phone call, not a setback.`

async function buildServicesHtml(): Promise<string> {
  let md = ""
  try {
    md = readContentMarkdown("services.md")
  } catch {
    md = ""
  }
  // Use the prepared markdown only if it is a real article (has an H1 title),
  // otherwise fall back to the authored brief above.
  const body = /^# /m.test(md) ? md : SERVICES_FALLBACK
  return marked.parse(body)
}

export default async function ServicesPage() {
  const html = await buildServicesHtml()
  const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(
    "Free consultation request"
  )}`

  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Services"
        title="Design, Supply & Installation"
        subtitle="One engineering-led team for the full lifecycle of your pool, spa, pond or fountain — from first calculation to commissioning and beyond."
        variant="teal"
      />

      <section className="content-container py-16 small:py-24">
        <div className="mb-14">
          <ImageBanner
            image="/images/brand/editorial-equipment.webp"
            imageAlt="Aquora engineers specifying pool and water-feature equipment"
            eyebrow="Design · supply · install"
            headline="From first calculation to commissioning"
            text="One engineering-led team for the full lifecycle of your pool, spa, pond or fountain — sized correctly, installed properly, supported long after."
            cta={{ label: "Request a consultation", href: "/contact" }}
            secondaryCta={{ label: "Browse equipment", href: "/store" }}
            variant="category"
            align="left"
          />
        </div>
        <article
          className="prose prose-headings:font-heading prose-headings:tracking-tight prose-lg max-w-none prose-a:text-aquora-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Closing CTA */}
        <div className="mt-16 rounded-large border border-black/5 bg-aquora-surface px-8 py-12 small:px-12 small:py-16 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink">
              Ready to specify it properly?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-aquora-muted">
              Share your project and our engineers will size it correctly the
              first time. {brand.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LocalizedClientLink href="/contact" className="btn-accent">
                Request a free consultation
              </LocalizedClientLink>
              <a href={mailto} className="btn-outline">
                Email {contact.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
