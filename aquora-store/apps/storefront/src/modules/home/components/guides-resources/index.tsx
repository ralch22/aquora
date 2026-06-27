import LocalizedClientLink from "@modules/common/components/localized-client-link"
import InteractiveLink from "@modules/common/components/interactive-link"

// Authority / expertise: feature real buyer's-guide articles + the FAQ + services, so the
// homepage establishes Aquora as a technical resource, not just a price list.
const GUIDES = [
  {
    tag: "Buying guide",
    title: "Salt chlorination in the UAE — is it right for your pool?",
    href: "/blog/salt-chlorination-uae",
  },
  {
    tag: "Energy",
    title: "Variable-speed pumps: how much they really save",
    href: "/blog/variable-speed-pumps",
  },
  {
    tag: "Water care",
    title: "Hard water & scale in the Gulf — and how to manage it",
    href: "/blog/hard-water-scale",
  },
]

const GuidesResources = () => {
  return (
    <section className="bg-aquora-surface">
      <div className="content-container py-16 small:py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
              Guides &amp; resources
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.6rem] small:leading-[1.08]">
              Spec it right the first time.
            </h2>
          </div>
          <div className="flex gap-6">
            <InteractiveLink href="/blog">All guides</InteractiveLink>
            <InteractiveLink href="/faq">FAQs</InteractiveLink>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 small:grid-cols-3">
          {GUIDES.map((g) => (
            <LocalizedClientLink
              key={g.href}
              href={g.href}
              className="group flex flex-col justify-between rounded-[1.5rem] border border-black/[0.06] bg-white p-7 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-aquora-primary/25 hover:shadow-[0_24px_44px_-24px_rgba(14,110,115,0.3)]"
            >
              <div>
                <span className="rounded-full bg-aquora-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-aquora-primary">
                  {g.tag}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-aquora-ink transition-colors group-hover:text-aquora-primary">
                  {g.title}
                </h3>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-aquora-primary">
                Read guide
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GuidesResources
