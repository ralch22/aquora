import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Solution-finder: maps a shopper's intent to the right category, for mid-funnel visitors
// who think in problems ("heat my pool"), not catalogue categories.
const NEEDS = [
  {
    title: "Circulate & filter",
    sub: "Pumps, sand filters & multiport valves",
    href: "/categories/pool-filtration-systems",
    path: "M4 7h16M4 12h16M4 17h16",
  },
  {
    title: "Heat the water",
    sub: "Inverter heat pumps & exchangers",
    href: "/categories/pool-heaters",
    path: "M12 3c2 3-2 4 0 7M8 6c1 2-1 3 0 5M9 21h6a3 3 0 0 0 0-6H9a3 3 0 0 0 0 6Z",
  },
  {
    title: "Clean & maintain",
    sub: "Robotic cleaners & accessories",
    href: "/categories/pool-cleaners",
    path: "M5 12a7 7 0 0 1 14 0v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4ZM9 15h.01M15 15h.01",
  },
  {
    title: "Treat & automate",
    sub: "Dosing, salt chlorination & UV",
    href: "/categories/water-treatment-equipment",
    path: "M12 3v4M7 7h10l-2 12a2 2 0 0 1-2 1.6h-2A2 2 0 0 1 9 19Z",
  },
  {
    title: "Light the water",
    sub: "LED pool & pond lighting",
    href: "/categories/pool-lighting",
    path: "M9 18h6M10 21h4M12 3a6 6 0 0 1 4 10c-.7.7-1 1.3-1 2H9c0-.7-.3-1.3-1-2a6 6 0 0 1 4-10Z",
  },
  {
    title: "Fountains & features",
    sub: "Nozzles & water effects",
    href: "/categories/fountain-nozzles",
    path: "M12 3c0 4-4 5-4 9a4 4 0 0 0 8 0c0-4-4-5-4-9ZM4 21c2-2 4-2 4-2M16 19s2 0 4 2",
  },
]

const ShopByNeed = () => {
  return (
    <section className="bg-aquora-surface">
      <div className="content-container py-16 small:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Shop by what you&apos;re building
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.6rem] small:leading-[1.08]">
            Start with the job, not the catalogue.
          </h2>
          <p className="mt-4 text-aquora-muted">
            Tell us what your project needs and we&apos;ll point you to the right engineered equipment.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 small:grid-cols-2 lg:grid-cols-3">
          {NEEDS.map((n) => (
            <LocalizedClientLink
              key={n.title}
              href={n.href}
              className="group relative flex items-center gap-5 overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-aquora-primary/25 hover:shadow-[0_24px_44px_-24px_rgba(14,110,115,0.3)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aquora-primary/10 text-aquora-primary transition-colors group-hover:bg-aquora-primary group-hover:text-white">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.path} />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-semibold text-aquora-ink">{n.title}</h3>
                <p className="text-sm text-aquora-muted">{n.sub}</p>
              </div>
              <svg className="ml-auto h-5 w-5 shrink-0 text-aquora-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-aquora-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ShopByNeed
