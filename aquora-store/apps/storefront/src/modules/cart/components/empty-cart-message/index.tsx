import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PremiumCta from "@modules/common/components/premium-cta"
import { categories } from "@lib/aquora/categories"

const EmptyCartMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center small:py-32" data-testid="empty-cart-message">
      {/* Double-bezel icon */}
      <div className="aq-float mb-8 grid h-24 w-24 place-items-center rounded-[1.75rem] border border-black/[0.06] bg-white shadow-[0_22px_44px_-26px_rgba(11,31,36,0.28)]">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-aquora-surface text-aquora-primary">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20.5 8H6" />
            <circle cx="9.5" cy="20" r="1.1" />
            <circle cx="18" cy="20" r="1.1" />
          </svg>
        </div>
      </div>

      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
        Your cart
      </span>
      <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-4xl">
        Your cart is empty
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-aquora-muted">
        Browse 5,900+ genuine pool, spa and fountain components — engineered, stocked in the UAE and ready to ship.
      </p>

      <div className="mt-8">
        <PremiumCta href="/store" variant="primary">
          Explore the catalogue
        </PremiumCta>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
        {categories.slice(0, 6).map((c) => (
          <LocalizedClientLink
            key={c.handle}
            href={`/categories/${c.handle}`}
            className="rounded-full border border-black/[0.08] bg-white px-4 py-1.5 text-sm text-aquora-ink/80 transition-[transform,color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-aquora-primary/30 hover:text-aquora-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            {c.name}
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default EmptyCartMessage
