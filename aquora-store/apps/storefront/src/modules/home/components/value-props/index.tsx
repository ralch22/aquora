import { brand } from "@lib/aquora/brand"

// Distinct inline SVG icons, one per value prop (order-matched).
const icons = [
  // Genuine Engineering — gear/precision
  <svg key="0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>,
  // Fast UAE-Wide Delivery — truck
  <svg key="1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 6h11v9H3zM14 9h4l3 3v3h-7z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <circle cx="7" cy="17" r="1.8" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="17.5" cy="17" r="1.8" stroke="currentColor" strokeWidth="1.6" />
  </svg>,
  // Expert Design & Installation — drafting / wrench
  <svg key="2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L4 17v3h3l5.9-5.9a3.5 3.5 0 0 0 4.6-4.6L15 12l-3-3 2.5-2.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>,
  // Dependable After-Sales Support — shield/check
  <svg key="3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="m9 12 2 2 4-4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>,
]

const ValueProps = () => {
  return (
    <section className="bg-aquora-secondary">
      <div className="content-container py-16 small:py-24">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-aquora-accent">
            Why Aquora
          </p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white small:text-4xl">
            Equipment you can specify with confidence
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 xsmall:grid-cols-2 small:grid-cols-4">
          {brand.value_props.map((prop, i) => (
            <div key={prop.title}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-large bg-white/5 text-aquora-accent ring-1 ring-white/10">
                <span className="block h-6 w-6">{icons[i]}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold tracking-tight text-white">
                {prop.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {prop.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ValueProps
