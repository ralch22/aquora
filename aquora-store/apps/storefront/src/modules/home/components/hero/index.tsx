import Image from "next/image"
import PremiumCta from "@modules/common/components/premium-cta"
import homepage from "@lib/aquora/content/homepage.json"

const HERO_PRODUCT = {
  title: "Dolphin Scoop Smart",
  sub: "Robotic pool cleaner",
  price: "AED 4,410",
  img: "https://storage.googleapis.com/emerge-aquora-products/dolphin-scoop-smart-robotic-swimming-pool-cleaner-12-15-m/0.webp",
}

const TRUST = ["5,000+ products in stock", "Genuine, engineered equipment", "48-hr UAE-wide delivery"]

const d = (ms: number) => ({ "--aq-d": `${ms}ms` } as React.CSSProperties)

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-aquora-secondary">
      {/* Atmospheric photo + teal wash + wave motif */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image src="/images/brand/hero-bg.webp" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-aquora-secondary/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-aquora-secondary via-aquora-secondary/85 to-aquora-secondary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-aquora-secondary/90 via-transparent to-aquora-secondary/20" />
        <div className="absolute -left-40 -top-24 h-[560px] w-[560px] rounded-full bg-aquora-primary/40 blur-[130px]" />
        <div className="absolute right-0 top-1/4 h-[460px] w-[460px] rounded-full bg-aquora-accent/15 blur-[140px]" />
        <svg className="absolute inset-0 h-full w-full text-white/[0.05]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 720" fill="none">
          <path d="M0 560 C 240 500, 480 620, 720 560 S 1200 500, 1440 560" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 620 C 240 560, 480 680, 720 620 S 1200 560, 1440 620" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="content-container relative z-10 grid items-center gap-12 py-20 small:grid-cols-12 small:py-28 lg:py-32">
        {/* Copy */}
        <div className="small:col-span-7 lg:col-span-6">
          <span
            style={d(40)}
            className="aq-reveal inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-aquora-accent backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            {homepage.hero_eyebrow}
          </span>
          <h1 style={d(120)} className="aq-reveal mt-6 font-heading text-[2.7rem] font-extrabold leading-[1.02] tracking-tight text-white small:text-6xl lg:text-[4.6rem]">
            {homepage.hero_title}
          </h1>
          <p style={d(200)} className="aq-reveal mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            {homepage.hero_sub}
          </p>
          <div style={d(280)} className="aq-reveal mt-9 flex flex-wrap items-center gap-3">
            <PremiumCta href="/store" variant="accent">
              {homepage.hero_cta}
            </PremiumCta>
            <PremiumCta href="/services" variant="ghost">
              {homepage.hero_cta_secondary}
            </PremiumCta>
          </div>
          <ul style={d(360)} className="aq-reveal mt-12 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-white/55">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-aquora-accent">
                  <path d="M3 8.5l3 3 7-7.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Featured product — double-bezel glass frame */}
        <div style={d(180)} className="aq-reveal small:col-span-5 lg:col-span-6">
          <div className="relative mx-auto max-w-md">
            <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.06] p-2 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md">
              <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-white to-aquora-surface">
                <div className="aq-float aspect-square p-10">
                  <Image src={HERO_PRODUCT.img} alt={HERO_PRODUCT.title} width={560} height={560} className="h-full w-full object-contain" priority />
                </div>
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl border border-black/5 bg-white/90 px-4 py-3 backdrop-blur">
                  <div>
                    <p className="text-sm font-semibold text-aquora-ink">{HERO_PRODUCT.title}</p>
                    <p className="text-xs text-aquora-muted">{HERO_PRODUCT.sub}</p>
                  </div>
                  <span className="rounded-full bg-aquora-primary/10 px-2.5 py-1 text-xs font-bold text-aquora-primary">{HERO_PRODUCT.price}</span>
                </div>
              </div>
            </div>
            <div className="aq-float-sm absolute -left-4 top-10 hidden rounded-2xl border border-white/10 bg-white/90 px-3.5 py-2 shadow-lg backdrop-blur small:block">
              <p className="text-[10px] uppercase tracking-wide text-aquora-muted">Cleans</p>
              <p className="text-sm font-bold text-aquora-ink">12–15 m pools</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
