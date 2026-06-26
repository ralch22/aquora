import { Metadata } from "next"
import { notFound } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { brand } from "@lib/aquora/brand"
import PageHeader from "../_lib/page-header"
import {
  readContentMarkdown,
  renderContentMarkdown,
  extractTitle,
  extractExcerpt,
  listBlogSlugs,
} from "../_lib/markdown"

const TOPIC_RULES: [RegExp, string][] = [
  [/heatpump|heat-pump/, "Heating"],
  [/filtration|filter/, "Filtration"],
  [/salt|chlorinat|scale|hard-water/, "Water Treatment"],
  [/pump/, "Circulation"],
  [/cover|evaporat|energy/, "Efficiency"],
  [/light/, "Lighting"],
  [/spa/, "Spa & Wellness"],
  [/pond|fountain|feature/, "Water Features"],
  [/automation|smart|control/, "Automation"],
]

function topicFor(slug: string): string {
  for (const [re, label] of TOPIC_RULES) if (re.test(slug)) return label
  return "Guide"
}

function isValidSlug(slug: string): boolean {
  return listBlogSlugs().includes(slug)
}

export function generateStaticParams() {
  return listBlogSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params

  if (!isValidSlug(slug)) {
    return { title: "Article not found — Aquora" }
  }

  const md = readContentMarkdown(`blog/${slug}.md`)
  const title = extractTitle(md, "Aquora Guide")
  const description = extractExcerpt(md, 160)

  return {
    title: `${title} — Aquora`,
    description,
  }
}

export default async function BlogArticlePage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  if (!isValidSlug(slug)) {
    notFound()
  }

  const md = readContentMarkdown(`blog/${slug}.md`)
  const title = extractTitle(md, "Aquora Guide")
  const html = await renderContentMarkdown(`blog/${slug}.md`)

  return (
    <div className="bg-white">
      <PageHeader
        eyebrow={`Insights & Guides · ${topicFor(slug)}`}
        title={title}
        subtitle={brand.tagline}
        variant="teal"
      />

      <section className="content-container py-16 small:py-24">
        <div className="mx-auto max-w-3xl">
          <LocalizedClientLink
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-aquora-primary hover:text-aquora-secondary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 8H3M7 4 3 8l4 4" />
            </svg>
            All insights & guides
          </LocalizedClientLink>

          <article
            className="prose prose-headings:font-heading prose-headings:tracking-tight prose-h1:hidden prose-lg mt-8 max-w-none prose-a:text-aquora-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Closing CTA */}
          <div className="mt-14 rounded-large border border-black/5 bg-aquora-surface p-8 small:p-10 shadow-sm">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink">
              Want this specified for your project?
            </h2>
            <p className="mt-3 text-aquora-muted">
              Our engineers will size and specify the right equipment for your
              pool, spa or water feature — built for Gulf conditions.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <LocalizedClientLink href="/services" className="btn-primary">
                Explore our services
              </LocalizedClientLink>
              <LocalizedClientLink href="/contact" className="btn-accent">
                Request a free consultation
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
