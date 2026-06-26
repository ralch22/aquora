import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { categories } from "@lib/aquora/categories"
import PremiumCta from "@modules/common/components/premium-cta"
import Reveal from "@modules/common/components/reveal"

const Arrow = ({ className = "" }: { className?: string }) => (
  <svg className={`h-4 w-4 ${className}`} viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CategoryGrid = () => {
  const [feature, ...rest] = categories

  return (
    <section className="bg-white">
      <div className="content-container py-20 small:py-28">
        {/* Asymmetric header */}
        <div className="mb-12 flex flex-col gap-6 small:flex-row small:items-end small:justify-between">
          <Reveal className="max-w-2xl">
            <span className="inline-block rounded-full bg-aquora-primary/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
              The catalogue
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.75rem] small:leading-[1.05]">
              Shop by category
            </h2>
            <p className="mt-4 text-base leading-relaxed text-aquora-muted">
              Sixteen complete equipment lines for pools, spas, ponds and fountains — every part specified for Gulf water and climate.
            </p>
          </Reveal>
          <Reveal delay={120} className="shrink-0">
            <PremiumCta href="/store" variant="ink">
              Browse all products
            </PremiumCta>
          </Reveal>
        </div>

        {/* Asymmetric bento: feature tile spans two columns */}
        <Reveal className="grid grid-cols-2 gap-4 small:grid-cols-3 lg:grid-cols-4">
          <LocalizedClientLink
            href={`/categories/${feature.handle}`}
            className="group relative col-span-2 row-span-2 flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-aquora-secondary to-aquora-primary p-7 text-white shadow-[0_24px_60px_-30px_rgba(10,58,66,0.6)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
          >
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.06]" preserveAspectRatio="none" viewBox="0 0 400 300" fill="none">
              <path d="M0 220 Q 100 180 200 220 T 400 220" stroke="currentColor" strokeWidth="1.5" />
              <path d="M0 250 Q 100 210 200 250 T 400 250" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="relative text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent">Most shopped</span>
            <div className="relative">
              <h3 className="font-heading text-2xl font-bold tracking-tight small:text-3xl">{feature.name}</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/85">
                Explore range
                <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </LocalizedClientLink>

          {rest.map((category) => (
            <LocalizedClientLink
              key={category.handle}
              href={`/categories/${category.handle}`}
              className="group flex h-full flex-col justify-between rounded-[1.4rem] border border-black/[0.06] bg-aquora-surface p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-aquora-primary/25 hover:bg-white hover:shadow-[0_18px_36px_-22px_rgba(14,110,115,0.28)]"
            >
              <h3 className="font-heading text-[0.95rem] font-semibold leading-snug tracking-tight text-aquora-ink transition-colors group-hover:text-aquora-primary">
                {category.name}
              </h3>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-aquora-accentdark">
                Explore
                <Arrow className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </LocalizedClientLink>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

export default CategoryGrid
