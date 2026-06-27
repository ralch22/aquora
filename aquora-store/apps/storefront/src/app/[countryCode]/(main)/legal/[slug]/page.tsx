import { Metadata } from "next"
import { notFound } from "next/navigation"

import PageHeader from "../../blog/_lib/page-header"
import { renderContentMarkdown } from "../../blog/_lib/markdown"

const PAGES: Record<string, { title: string; description: string }> = {
  terms: { title: "Terms & Conditions", description: "The terms that govern purchases from Aquora." },
  privacy: { title: "Privacy Policy", description: "How Aquora collects, uses and protects your data." },
  returns: { title: "Returns & Refunds", description: "How returns, refunds and cancellations work at Aquora." },
  shipping: { title: "Shipping Policy", description: "Delivery coverage, charges and timescales across the UAE and GCC." },
  cookies: { title: "Cookie Policy", description: "How Aquora uses cookies and how you control them." },
}

type Params = Promise<{ slug: string; countryCode: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const p = PAGES[slug]
  if (!p) return {}
  return { title: `${p.title} — Aquora`, description: p.description }
}

export default async function LegalPage({ params }: { params: Params }) {
  const { slug } = await params
  const p = PAGES[slug]
  if (!p) notFound()

  const html = await renderContentMarkdown(`legal/${slug}.md`)

  return (
    <div className="bg-white">
      <PageHeader eyebrow="Legal" title={p.title} subtitle={p.description} variant="surface" />
      <section className="content-container py-16 small:py-24">
        <article
          className="prose prose-headings:font-heading prose-headings:tracking-tight prose-h1:hidden prose-lg max-w-3xl prose-a:text-aquora-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </div>
  )
}
