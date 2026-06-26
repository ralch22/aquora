import LocalizedClientLink from "@modules/common/components/localized-client-link"
import homepage from "@lib/aquora/content/homepage.json"

const Hero = () => {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-aquora-secondary to-aquora-primary">
      {/* Subtle ripple / wave motif */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.06]"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 720"
        fill="none"
      >
        <defs>
          <radialGradient id="hero-glow" cx="20%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#E0A23B" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#E0A23B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1440" height="720" fill="url(#hero-glow)" />
        <path
          d="M0 540 C 240 480, 480 600, 720 540 S 1200 480, 1440 540"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0 600 C 240 540, 480 660, 720 600 S 1200 540, 1440 600"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0 660 C 240 600, 480 720, 720 660 S 1200 600, 1440 660"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      {/* Faint engineering ring (echoes the logo "O") */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 hidden h-[420px] w-[420px] rounded-full border border-white/10 small:block"
      >
        <div className="absolute inset-12 rounded-full border border-aquora-accent/20" />
        <div className="absolute inset-28 rounded-full border border-white/5" />
      </div>

      <div className="content-container relative z-10 flex flex-col justify-center py-24 small:py-36">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-aquora-accent">
            {homepage.hero_eyebrow}
          </p>
          <h1 className="font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-white small:text-7xl">
            {homepage.hero_title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 small:text-xl">
            {homepage.hero_sub}
          </p>
          <div className="mt-10 flex flex-col gap-4 xsmall:flex-row">
            <LocalizedClientLink href="/store" className="btn-accent">
              {homepage.hero_cta}
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/services"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-white hover:text-aquora-secondary"
            >
              {homepage.hero_cta_secondary}
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
