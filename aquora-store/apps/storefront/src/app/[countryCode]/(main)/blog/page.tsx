import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PageHeader from "./_lib/page-header"
import { readContentMarkdown, extractTitle, extractExcerpt } from "./_lib/markdown"

export const metadata: Metadata = {
  title: "Insights & Guides — Aquora",
  description:
    "Engineer-led guides on pool filtration, saltwater systems, heat-pump sizing and architectural fountains — written for Gulf conditions by the Aquora technical team.",
}

const SLUGS = ["filtration", "saltwater", "heatpump", "fountain"] as const

const FALLBACK_TITLES: Record<string, string> = {
  filtration: "Choosing the Right Pool Filtration System",
  saltwater: "Saltwater vs Chlorine Pools in the Gulf",
  heatpump: "Sizing a Pool Heat Pump for Year-Round Swimming",
  fountain: "Designing a Modern Architectural Fountain",
}

const TOPICS: Record<string, string> = {
  filtration: "Filtration",
  saltwater: "Water Treatment",
  heatpump: "Heating",
  fountain: "Fountains",
}

function getArticles() {
  return SLUGS.map((slug) => {
    const md = readContentMarkdown(`blog/${slug}.md`)
    return {
      slug,
      topic: TOPICS[slug],
      title: extractTitle(md, FALLBACK_TITLES[slug]),
      excerpt: extractExcerpt(md, 220),
    }
  })
}

export default function BlogIndexPage() {
  const articles = getArticles()

  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Insights & Guides"
        title="Insights & Guides"
        subtitle="Practical, engineer-led guidance on specifying and running pool, spa and water-feature equipment in Gulf conditions."
        variant="teal"
      />

      <section className="content-container py-16 small:py-24">
        <div className="grid grid-cols-1 gap-8 small:grid-cols-2">
          {articles.map((article) => (
            <LocalizedClientLink
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex flex-col overflow-hidden rounded-large border border-black/5 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* CSS visual band (no photography) */}
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-aquora-secondary to-aquora-primary">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full text-white opacity-[0.16]"
                  preserveAspectRatio="none"
                  viewBox="0 0 400 180"
                  fill="none"
                >
                  <path d="M0 120 Q 100 80 200 120 T 400 120" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 145 Q 100 105 200 145 T 400 145" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 95 Q 100 55 200 95 T 400 95" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-aquora-accent px-3 py-1 text-xs font-semibold text-aquora-ink">
                  {article.topic}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <h2 className="font-heading text-xl small:text-2xl font-bold tracking-tight text-aquora-ink transition-colors group-hover:text-aquora-primary">
                  {article.title}
                </h2>
                <p className="mt-3 flex-1 text-base leading-relaxed text-aquora-muted">
                  {article.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-aquora-primary">
                  Read the guide
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </span>
              </div>
            </LocalizedClientLink>
          ))}
        </div>
      </section>
    </div>
  )
}
