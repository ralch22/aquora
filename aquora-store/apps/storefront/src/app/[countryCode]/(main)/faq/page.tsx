import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { contact } from "@lib/aquora/brand"
import faq from "@lib/aquora/content/faq.json"
import PageHeader from "../blog/_lib/page-header"

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Aquora",
  description:
    "Delivery, lead times, installation, warranty, payments, VAT, trade pricing and after-sales support — answers to the questions we hear most from villa owners and contractors across the UAE and GCC.",
}

type FaqItem = { q: string; a: string }

export default function FaqPage() {
  const items = (faq.items ?? []) as FaqItem[]

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <PageHeader
        eyebrow="Support"
        title="Frequently Asked Questions"
        subtitle="Practical answers on delivery, installation, warranty, payments and after-sales support across the UAE and wider GCC."
        variant="teal"
      />

      <section className="content-container py-16 small:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="divide-y divide-black/5 border-y border-black/5">
            {items.map((item, i) => (
              <details
                key={i}
                className="group py-2"
                {...(i === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                  <h2 className="font-heading text-lg small:text-xl font-semibold tracking-tight text-aquora-ink">
                    {item.q}
                  </h2>
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-aquora-muted/40 text-aquora-primary transition-transform duration-200 group-open:rotate-45"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    >
                      <path d="M7 1.5v11M1.5 7h11" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-6 pr-12 text-base leading-relaxed text-aquora-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-14 rounded-large bg-gradient-to-br from-aquora-secondary to-aquora-primary px-8 py-10 text-white shadow-sm">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Still have a question?
            </h2>
            <p className="mt-3 max-w-xl text-white/85">
              Our engineer-led team is happy to help with sizing, specification
              or anything our FAQ does not cover.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <LocalizedClientLink href="/contact" className="btn-accent">
                Talk to our team
              </LocalizedClientLink>
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-white hover:text-aquora-secondary"
              >
                {contact.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
