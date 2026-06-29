import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageBanner from "@modules/common/components/image-banner"

export const metadata: Metadata = {
  title: "Pool Care 101 — Free Tools, Guides & Troubleshooting | Aquora",
  description:
    "Everything you need to keep your pool clear and balanced — free dosing and sizing calculators, a pool problem solver, buying guides and expert articles from Aquora's specialists.",
  openGraph: {
    title: "Pool Care 101 | Aquora",
    description: "Free tools and expert guides to keep your pool perfect, the easy way.",
    type: "website",
  },
}

type Card = {
  eyebrow: string
  title: string
  desc: string
  href: string
  cta: string
  featured?: boolean
  glyph: React.ReactNode
}

const TOOLS: Card[] = [
  {
    eyebrow: "Balance your water",
    title: "Chemical dosing calculator",
    desc: "Enter your volume and test results — get the exact chemical amounts to balance your pool, plus the products to fix it.",
    href: "/pool-dosing-calculator",
    cta: "Open the calculator",
    featured: true,
    glyph: <path d="M9 3h6M10 3v5l-4 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-9V3M7 14h10" />,
  },
  {
    eyebrow: "Fix a problem",
    title: "Pool problem solver",
    desc: "Green, cloudy, stained or smelly? Tap your problem for a step-by-step fix and the exact products to put it right.",
    href: "/pool-problem-solver",
    cta: "Solve my problem",
    glyph: <path d="M12 3a9 9 0 1 0 9 9M12 7v5l3 3M20 4l-3 3 3 1-1-4z" />,
  },
  {
    eyebrow: "Size your equipment",
    title: "Pool sizing calculator",
    desc: "Work out your pool volume and the right pump, filter, heater and chlorinator for it.",
    href: "/pool-sizing-guide",
    cta: "Size my equipment",
    glyph: <path d="M3 7h18M3 12h18M3 17h18M7 4v16" />,
  },
]

export default function PoolCarePage() {
  return (
    <div className="content-container py-10 small:py-14">
      <div className="mb-12">
        <ImageBanner
          image="/images/brand/editorial-support.webp"
          imageAlt="Aquora pool care specialists and free tools"
          eyebrow="Pool Care 101"
          headline="Pool care, made simple"
          text="Free tools, troubleshooting and straight-talking guides — balance, fix and size your pool with confidence."
          cta={{ label: "Try the dosing calculator", href: "/pool-dosing-calculator" }}
          secondaryCta={{ label: "Browse guides", href: "/guides" }}
          variant="category"
          align="left"
        />
      </div>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Pool Care 101
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.8rem]">
          A simpler way to look after your pool
        </h1>
        <p className="mt-3 text-aquora-muted">
          Free tools and straight-talking guides from our pool specialists — so you can balance, fix and size your
          pool with confidence, and get the right gear in a couple of clicks.
        </p>
      </div>

      {/* Tools */}
      <div className="grid gap-5 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <LocalizedClientLink
            key={t.href}
            href={t.href}
            className={`group flex flex-col rounded-[1.6rem] border p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${
              t.featured
                ? "border-aquora-primary/20 bg-gradient-to-br from-aquora-secondary to-aquora-primary text-white shadow-[0_28px_60px_-30px_rgba(14,110,115,0.55)]"
                : "border-black/[0.06] bg-white hover:border-aquora-primary/25 hover:shadow-[0_24px_50px_-28px_rgba(14,110,115,0.3)]"
            }`}
          >
            <span className={`grid h-12 w-12 place-items-center rounded-full ${t.featured ? "bg-white/15 text-white" : "bg-aquora-surface text-aquora-primary"}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {t.glyph}
              </svg>
            </span>
            <p className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] ${t.featured ? "text-aquora-accent" : "text-aquora-primary"}`}>{t.eyebrow}</p>
            <h2 className="mt-1.5 font-heading text-xl font-bold tracking-tight">{t.title}</h2>
            <p className={`mt-2 flex-1 text-sm leading-relaxed ${t.featured ? "text-white/75" : "text-aquora-muted"}`}>{t.desc}</p>
            <span className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${t.featured ? "text-white" : "text-aquora-primary"}`}>
              {t.cta}
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
            </span>
          </LocalizedClientLink>
        ))}
      </div>

      {/* Guides / next steps */}
      <div className="mt-14 grid gap-5 small:grid-cols-2">
        <LocalizedClientLink href="/guides" className="group flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/[0.06] bg-white p-6 transition-colors hover:border-aquora-primary/25">
          <div>
            <h3 className="font-heading text-lg font-bold text-aquora-ink">How-to &amp; buying guides</h3>
            <p className="mt-1 text-sm text-aquora-muted">Maintain, fix and choose — step-by-step, with the products you&apos;ll need.</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-aquora-primary transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
        </LocalizedClientLink>
        <LocalizedClientLink href="/faq" className="group flex items-center justify-between gap-4 rounded-[1.4rem] border border-black/[0.06] bg-white p-6 transition-colors hover:border-aquora-primary/25">
          <div>
            <h3 className="font-heading text-lg font-bold text-aquora-ink">Questions, answered</h3>
            <p className="mt-1 text-sm text-aquora-muted">Delivery, warranty, installation and the most-asked pool questions.</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-aquora-primary transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
        </LocalizedClientLink>
      </div>

      {/* Expert CTA */}
      <div className="mt-12 flex flex-col items-center gap-3 rounded-[1.75rem] border border-black/[0.06] bg-aquora-surface/60 px-6 py-8 text-center">
        <h3 className="font-heading text-xl font-bold text-aquora-ink">Still not sure?</h3>
        <p className="max-w-xl text-sm text-aquora-muted">
          Chat with Aqua, our AI pool advisor (bottom-right of any page), or talk to a real specialist — we&apos;re here
          to help you get it right the first time.
        </p>
        <LocalizedClientLink href="/contact" className="mt-2 inline-flex items-center justify-center rounded-full bg-aquora-ink px-6 py-3 text-sm font-semibold text-white transition active:scale-[0.98]">
          Talk to a specialist
        </LocalizedClientLink>
      </div>
    </div>
  )
}
