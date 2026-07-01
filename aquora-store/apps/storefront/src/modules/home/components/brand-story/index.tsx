import Image from "next/image"
import PremiumCta from "@modules/common/components/premium-cta"

const POINTS = [
  {
    t: "Specified to real standards",
    d: "Hydraulic and durability ratings you can design around — not badge-engineered imports.",
  },
  {
    t: "Stocked across the UAE & GCC",
    d: "Genuine equipment dispatched fast, so contractor schedules and pool seasons stay on track.",
  },
  {
    t: "Supported for years",
    d: "Genuine spares, clear warranties and responsive servicing long after purchase.",
  },
]

const BrandStory = () => {
  return (
    <section className="content-container py-20 small:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Image */}
        <div className="relative order-2 lg:order-1">
          <div className="rounded-[2rem] border border-black/5 bg-aquora-surface p-2">
            <div className="group overflow-hidden rounded-[1.6rem]">
              <Image
                src="/images/brand/story.webp"
                alt="A finished luxury swimming pool at a Dubai villa at dusk"
                width={1200}
                height={800}
                className="aspect-[3/2] h-full w-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
          </div>
          <div className="aq-float absolute -right-3 -top-5 hidden rounded-2xl border border-white/15 bg-aquora-secondary px-4 py-3 text-white shadow-xl small:block">
            <p className="text-[10px] uppercase tracking-wide text-aquora-accent">Built around</p>
            <p className="text-sm font-bold">Gulf water & climate</p>
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Why Aquora
          </p>
          <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-tight text-aquora-ink small:text-[2.8rem]">
            Engineered for water that lasts.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-aquora-muted">
            Aquora supplies the pumps, filtration, heating, lighting and automation that keep Gulf
            pools, spas, ponds and fountains running quietly and efficiently — paired with the
            technical expertise to specify, deliver and support them.
          </p>
          <ul className="mt-9 space-y-5">
            {POINTS.map((p) => (
              <li key={p.t} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aquora-primary/10 text-aquora-primary">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3 3 7-7.5" /></svg>
                </span>
                <div>
                  <p className="font-heading font-semibold text-aquora-ink">{p.t}</p>
                  <p className="text-sm leading-relaxed text-aquora-muted">{p.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3">
            <PremiumCta href="/about" variant="primary">Our story</PremiumCta>
            <PremiumCta href="/services" variant="ghost">Design &amp; installation</PremiumCta>
          </div>
        </div>
      </div>
    </section>
  )
}

export default BrandStory
