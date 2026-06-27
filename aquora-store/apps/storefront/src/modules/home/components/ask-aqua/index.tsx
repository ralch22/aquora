import PremiumCta from "@modules/common/components/premium-cta"

// Showcases the multimodal "Ask Aqua" assistant (text + photo). The assistant itself is the
// floating widget mounted site-wide; this band drives awareness + sends shoppers to browse.
const AskAqua = () => {
  return (
    <section className="content-container py-16 small:py-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-aquora-secondary to-aquora-primary px-8 py-14 text-white small:px-16 small:py-20">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.06]" preserveAspectRatio="none" viewBox="0 0 1200 400" fill="none">
          <path d="M0 280 C 200 220 400 320 600 270 S 1000 220 1200 270" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 320 C 200 260 400 360 600 310 S 1000 260 1200 310" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full bg-aquora-accent/15 blur-[60px] small:block" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
              Ask Aqua · AI assistant
            </span>
            <h2 className="mt-5 max-w-xl font-heading text-3xl font-bold leading-[1.1] tracking-tight small:text-[2.6rem]">
              Not sure what fits your pool? Just ask.
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/75">
              Describe your setup — or snap a photo of a part — and Aqua finds the right pump,
              filter, heater or spare from 5,900+ products, with specs and advice in seconds.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PremiumCta href="/store" variant="accent">Browse the catalogue</PremiumCta>
              <PremiumCta href="/search" variant="ghost">Search by name or photo</PremiumCta>
            </div>
          </div>

          {/* Mock chat card */}
          <div className="hidden lg:block">
            <div className="rounded-[1.75rem] border border-white/12 bg-white/[0.08] p-4 backdrop-blur-md">
              <div className="space-y-3">
                <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-white/90 px-4 py-2.5 text-sm text-aquora-ink">
                  Which pump for a 60 m³ villa pool?
                </div>
                <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md bg-aquora-secondary/60 px-4 py-2.5 text-sm text-white/90">
                  For ~60 m³ on a 4-hour turnover you want ≈15 m³/h. A variable-speed self-priming pump fits best — here are three options…
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AskAqua
