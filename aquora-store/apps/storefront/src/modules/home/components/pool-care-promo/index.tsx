import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Tool = { eyebrow: string; title: string; desc: string; href: string; glyph: React.ReactNode }

const TOOLS: Tool[] = [
  {
    eyebrow: "Balance",
    title: "Dosing calculator",
    desc: "Test results in, exact chemical doses out.",
    href: "/pool-dosing-calculator",
    glyph: <path d="M9 3h6M10 3v5l-4 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-9V3M7 14h10" />,
  },
  {
    eyebrow: "Fix",
    title: "Problem solver",
    desc: "Green, cloudy or stained? Tap it, fix it.",
    href: "/pool-problem-solver",
    glyph: <path d="M12 3a9 9 0 1 0 9 9M12 7v5l3 3M20 4l-3 3 3 1-1-4z" />,
  },
  {
    eyebrow: "Size",
    title: "Sizing calculator",
    desc: "The right pump, filter and heater for your pool.",
    href: "/pool-sizing-guide",
    glyph: <path d="M3 7h18M3 12h18M3 17h18M7 4v16" />,
  },
]

// Homepage "Pool Care 101" band — surfaces the free tools (the education-led commerce engine) so
// shoppers discover them. Server component (no client JS).
export default function PoolCarePromo() {
  return (
    <section className="content-container py-14 small:py-20">
      <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-gradient-to-br from-aquora-secondary to-aquora-primary p-7 text-white shadow-[0_30px_70px_-34px_rgba(14,110,115,0.5)] small:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
          <div className="lg:w-[34%]">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
              Pool Care 101
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight small:text-[2rem]">
              A simpler way to pool
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Free tools and straight-talking guides from our specialists — balance, fix and size your pool, then get
              the exact gear in a couple of clicks.
            </p>
            <LocalizedClientLink
              href="/pool-care"
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-aquora-accent py-2.5 pl-5 pr-3 text-sm font-semibold text-aquora-ink transition active:scale-[0.98]"
            >
              Explore Pool Care
              <span className="grid h-7 w-7 place-items-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
              </span>
            </LocalizedClientLink>
          </div>

          <div className="grid flex-1 gap-3 small:grid-cols-3">
            {TOOLS.map((t) => (
              <LocalizedClientLink
                key={t.href}
                href={t.href}
                className="group flex flex-col rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-white/[0.1]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/12 text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {t.glyph}
                  </svg>
                </span>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-aquora-accent">{t.eyebrow}</p>
                <p className="mt-1 font-heading text-base font-bold text-white">{t.title}</p>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-white/70">{t.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                  Open
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
