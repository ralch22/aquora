import homepage from "@lib/aquora/content/homepage.json"

const CheckIcon = () => (
  <svg
    className="h-5 w-5 flex-shrink-0 text-aquora-accent"
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="m6 10 2.5 2.5L14 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const TrustBand = () => {
  return (
    <section className="border-t border-black/5 bg-aquora-surface">
      <div className="content-container py-14 small:py-16">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.2em] text-aquora-muted">
          Why teams across the Gulf specify Aquora
        </p>
        <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-x-8 gap-y-4 xsmall:grid-cols-2 small:grid-cols-3">
          {homepage.trust_signals.map((signal) => (
            <li
              key={signal}
              className="flex items-center gap-3 text-sm font-medium text-aquora-ink"
            >
              <CheckIcon />
              {signal}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default TrustBand
