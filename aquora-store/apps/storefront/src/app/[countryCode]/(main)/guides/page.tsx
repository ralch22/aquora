import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageBanner from "@modules/common/components/image-banner"
import { listGuides, type Guide } from "@lib/aquora/guides"

export const metadata: Metadata = {
  title: "Pool How-To & Buying Guides | Aquora",
  description:
    "Step-by-step pool how-to guides and straight-talking buying guides from Aquora's specialists — maintain, fix and choose the right equipment for your pool, with the products you'll need.",
  openGraph: {
    title: "Pool How-To & Buying Guides | Aquora",
    description: "Maintain, fix and choose — practical pool guides with the products you'll need.",
    type: "website",
  },
}

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-aquora-primary",
  Moderate: "text-aquora-accentdark",
  Advanced: "text-red-500",
}

function GuideCard({ g }: { g: Guide }) {
  return (
    <LocalizedClientLink
      href={`/guides/${g.slug}`}
      className="group flex flex-col rounded-[1.5rem] border border-black/[0.06] bg-white p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-aquora-primary/25 hover:shadow-[0_24px_50px_-28px_rgba(14,110,115,0.3)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-aquora-primary">{g.category}</p>
      <h3 className="mt-2 font-heading text-lg font-bold tracking-tight text-aquora-ink transition-colors group-hover:text-aquora-primary">{g.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-aquora-muted">{g.excerpt}</p>
      <div className="mt-4 flex items-center gap-3 text-xs text-aquora-muted">
        <span className={`font-semibold ${DIFF_COLOR[g.difficulty] || ""}`}>{g.difficulty}</span>
        <span className="h-1 w-1 rounded-full bg-aquora-muted/40" />
        <span>{g.time}</span>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-aquora-primary transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
      </div>
    </LocalizedClientLink>
  )
}

export default function GuidesPage() {
  const guides = listGuides()
  const howto = guides.filter((g) => g.type === "how-to")
  const buying = guides.filter((g) => g.type === "buying")

  return (
    <div className="content-container py-10 small:py-14">
      <div className="mb-12">
        <ImageBanner
          image="/images/brand/editorial-install.webp"
          imageAlt="Pool how-to and buying guides from Aquora specialists"
          eyebrow="Guides"
          headline="Maintain, fix & choose — like a pro"
          text="Step-by-step how-to guides and straight-talking buying guides, each with the products you'll need."
          cta={{ label: "Explore Pool Care", href: "/pool-care" }}
          variant="category"
          align="left"
        />
      </div>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Guides
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.8rem]">
          Pool how-to &amp; buying guides
        </h1>
        <p className="mt-3 text-aquora-muted">
          Practical, step-by-step guides from our specialists — keep your pool perfect, fix problems fast, and choose
          the right equipment. Each one tells you exactly what you&apos;ll need.
        </p>
      </div>

      <section aria-labelledby="howto-heading">
        <div className="mb-6 flex items-center gap-3">
          <h2 id="howto-heading" className="font-heading text-2xl font-bold text-aquora-ink">How-to guides</h2>
          <span className="rounded-full bg-aquora-surface px-2.5 py-0.5 text-xs font-semibold text-aquora-muted">{howto.length}</span>
        </div>
        <div className="grid gap-5 small:grid-cols-2 lg:grid-cols-3">
          {howto.map((g) => <GuideCard key={g.slug} g={g} />)}
        </div>
      </section>

      <section aria-labelledby="buying-heading" className="mt-16">
        <div className="mb-6 flex items-center gap-3">
          <h2 id="buying-heading" className="font-heading text-2xl font-bold text-aquora-ink">Buying guides</h2>
          <span className="rounded-full bg-aquora-surface px-2.5 py-0.5 text-xs font-semibold text-aquora-muted">{buying.length}</span>
        </div>
        <div className="grid gap-5 small:grid-cols-2 lg:grid-cols-3">
          {buying.map((g) => <GuideCard key={g.slug} g={g} />)}
        </div>
      </section>

      <div className="mt-16 flex flex-col items-center gap-3 rounded-[1.75rem] border border-black/[0.06] bg-aquora-surface/60 px-6 py-8 text-center">
        <h3 className="font-heading text-xl font-bold text-aquora-ink">Prefer the quick route?</h3>
        <p className="max-w-xl text-sm text-aquora-muted">
          Use our free <LocalizedClientLink href="/pool-dosing-calculator" className="font-medium text-aquora-primary hover:underline">dosing calculator</LocalizedClientLink>,{" "}
          <LocalizedClientLink href="/pool-problem-solver" className="font-medium text-aquora-primary hover:underline">problem solver</LocalizedClientLink> and{" "}
          <LocalizedClientLink href="/pool-sizing-guide" className="font-medium text-aquora-primary hover:underline">sizing calculator</LocalizedClientLink> — all under <LocalizedClientLink href="/pool-care" className="font-medium text-aquora-primary hover:underline">Pool Care</LocalizedClientLink>.
        </p>
      </div>
    </div>
  )
}
