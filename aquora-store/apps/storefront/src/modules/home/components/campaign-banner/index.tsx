import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Bold, full-width SEASONAL CAMPAIGN banner. Honest framing — the "offer" is the genuine value
// (free UAE delivery, free expert tools, warrantied gear), not a fabricated discount. To run a
// real percentage sale, wire Medusa promotions and swap the copy/feature pills.
const FEATURES = [
  "Free UAE delivery over AED 500",
  "Free dosing & sizing tools",
  "Genuine, warrantied equipment",
  "Fast, UAE-wide delivery",
]

export default function CampaignBanner() {
  return (
    <section className="content-container py-10 small:py-14">
      <div className="relative overflow-hidden rounded-[2rem] bg-aquora-secondary">
        {/* Photo + atmospheric wash */}
        <Image
          src="/images/brand/hero-bg.webp"
          alt="A pristine pool ready for the swim season"
          fill
          sizes="100vw"
          quality={72}
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-aquora-secondary via-aquora-secondary/90 to-aquora-secondary/40" />
        <div aria-hidden className="absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full bg-aquora-primary/40 blur-[120px]" />
        <div aria-hidden className="absolute right-0 bottom-0 h-[360px] w-[360px] rounded-full bg-aquora-accent/15 blur-[130px]" />

        <div className="relative z-10 px-7 py-12 small:px-12 small:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-aquora-accent/40 bg-aquora-accent/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-aquora-accent backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aquora-accent" />
            The swim season is here
          </span>
          <h2 className="mt-5 max-w-2xl font-heading text-4xl font-extrabold leading-[1.04] tracking-tight text-white small:text-[3.4rem]">
            Pool Season at Aquora
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/80">
            Everything to open, balance and enjoy your pool this season — with genuine equipment, free expert tools and
            fast delivery across the Emirates.
          </p>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm font-medium text-white/85">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-aquora-accent/20 text-aquora-accent">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 8.5l3 3 7-7.5" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <LocalizedClientLink
              href="/store"
              className="group inline-flex items-center gap-2 rounded-full bg-aquora-accent py-3.5 pl-7 pr-3 text-sm font-semibold text-aquora-ink shadow-sm transition active:scale-[0.98]"
            >
              Shop the essentials
              <span className="grid h-7 w-7 place-items-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                </svg>
              </span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/pool-care"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Get summer-ready
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
