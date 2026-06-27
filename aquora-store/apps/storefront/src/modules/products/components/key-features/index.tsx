import { HttpTypes } from "@medusajs/types"

// Premium "Key features" list — gold-tick bullets grounded in the product's specs.
// Renders nothing when a product has no generated features (graceful fallback).
export default function KeyFeatures({ product }: { product: HttpTypes.StoreProduct }) {
  const features = ((product.metadata as any)?.features as string[]) || []
  if (!features.length) return null

  return (
    <section aria-labelledby="key-features-heading" className="rounded-[1.4rem] border border-black/[0.06] bg-aquora-surface/60 p-5">
      <h3 id="key-features-heading" className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-aquora-muted">
        Key features
      </h3>
      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3">
        {features.slice(0, 6).map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-aquora-ink">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-aquora-accentdark"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 8.5l3 3 7-7.5" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
