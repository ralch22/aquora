import { Metadata } from "next"
import { notFound } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getGuide, listGuides } from "@lib/aquora/guides"
import ProductPicksServer from "@modules/tools/components/product-picks/ProductPicksServer"

type Props = { params: Promise<{ slug: string; countryCode: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const g = getGuide(slug)
  if (!g) return { title: "Guide — Aquora" }
  return {
    title: `${g.title} | Aquora`,
    description: g.excerpt,
    openGraph: { title: `${g.title} | Aquora`, description: g.excerpt, type: "article" },
  }
}

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-aquora-primary",
  Moderate: "text-aquora-accentdark",
  Advanced: "text-red-500",
}

export default async function GuidePage(props: Props) {
  const { slug } = await props.params
  const g = getGuide(slug)
  if (!g) notFound()

  const related = (g.related || []).map((s) => getGuide(s)).filter(Boolean)

  // HowTo / Article JSON-LD for rich results (how-to guides use HowTo, buying guides use Article).
  const jsonLd =
    g.type === "how-to"
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: g.title,
          description: g.excerpt,
          totalTime: undefined,
          step: g.steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.body,
          })),
        }
      : {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.excerpt,
          author: { "@type": "Organization", name: "Aquora" },
        }

  return (
    <div className="content-container py-10 small:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-aquora-muted" aria-label="Breadcrumb">
        <LocalizedClientLink href="/pool-care" className="hover:text-aquora-primary">Pool Care</LocalizedClientLink>
        <span>/</span>
        <LocalizedClientLink href="/guides" className="hover:text-aquora-primary">Guides</LocalizedClientLink>
        <span>/</span>
        <span className="text-aquora-ink/70">{g.title}</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          {g.type === "how-to" ? "How-to guide" : "Buying guide"} · {g.category}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.4rem]">{g.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-aquora-muted">{g.intro}</p>

        {/* Meta badges */}
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm">
            <span className="text-aquora-muted">Difficulty</span>
            <span className={`font-bold ${DIFF_COLOR[g.difficulty] || "text-aquora-ink"}`}>{g.difficulty}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm">
            <span className="text-aquora-muted">Time</span>
            <span className="font-bold text-aquora-ink">{g.time}</span>
          </span>
        </div>

        {/* What you'll need */}
        <div className="mt-8 rounded-[1.5rem] border border-black/[0.06] bg-aquora-surface/50 p-6">
          <h2 className="font-heading text-lg font-bold text-aquora-ink">What you&apos;ll need</h2>
          {/* Real products for each item — self-hides per category when nothing is stocked. */}
          <div className="mt-5 flex flex-col gap-7">
            {g.whatYouNeed.map((p) => (
              <ProductPicksServer key={`picks-${p.href}`} source={p.href} limit={2} title={p.label} cols={2} />
            ))}
          </div>
          {/* Browse-all links — always present as the fallback. */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {g.whatYouNeed.map((p) => (
              <LocalizedClientLink key={p.href} href={p.href}
                className="group inline-flex items-center gap-1.5 rounded-full border border-aquora-primary/30 bg-white px-4 py-2 text-sm font-semibold text-aquora-primary transition hover:bg-aquora-primary hover:text-white">
                {p.label}
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
              </LocalizedClientLink>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="mt-10">
          <h2 className="font-heading text-2xl font-bold text-aquora-ink">{g.type === "how-to" ? "Step by step" : "What to consider"}</h2>
          <ol className="mt-6 space-y-6">
            {g.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-aquora-primary text-sm font-bold text-white">{i + 1}</span>
                <div className="pt-1">
                  <h3 className="font-heading text-lg font-bold text-aquora-ink">{s.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-aquora-ink/85">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Tip */}
        {g.tip && (
          <div className="mt-8 flex gap-3 rounded-[1.4rem] border border-aquora-accent/30 bg-aquora-accent/[0.06] p-5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-aquora-accent/20 text-aquora-accentdark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V16h6v-.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3z" /></svg>
            </span>
            <p className="text-sm leading-relaxed text-aquora-ink"><span className="font-semibold">Tip:</span> {g.tip}</p>
          </div>
        )}

        {/* Safety / expert CTA */}
        <div className="mt-8 flex flex-col gap-3 rounded-[1.4rem] border border-black/[0.06] bg-white p-5 text-sm text-aquora-muted small:flex-row small:items-center small:justify-between">
          <p>Need exact chemical amounts or help choosing? Use our <LocalizedClientLink href="/pool-dosing-calculator" className="font-medium text-aquora-primary hover:underline">dosing calculator</LocalizedClientLink>, or ask Aqua — our AI advisor, bottom-right.</p>
          <LocalizedClientLink href="/contact" className="inline-flex shrink-0 items-center justify-center rounded-full bg-aquora-ink px-5 py-2.5 text-sm font-semibold text-white">Talk to our team</LocalizedClientLink>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-xl font-bold text-aquora-ink">Related guides</h2>
            <div className="mt-4 grid gap-4 small:grid-cols-2">
              {related.map((r) => (
                <LocalizedClientLink key={r!.slug} href={`/guides/${r!.slug}`} className="group flex items-center justify-between gap-4 rounded-[1.3rem] border border-black/[0.06] bg-white p-5 transition-colors hover:border-aquora-primary/25">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-aquora-primary">{r!.type === "how-to" ? "How-to" : "Buying guide"}</p>
                    <h3 className="mt-1 text-sm font-bold text-aquora-ink">{r!.title}</h3>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-aquora-primary transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
