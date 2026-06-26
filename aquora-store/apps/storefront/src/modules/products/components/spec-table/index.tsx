import { HttpTypes } from "@medusajs/types"

type Spec = { name: string; value: string }

// Full specification table, sourced from scraped factual product data (metadata.specs).
export default function SpecTable({ product }: { product: HttpTypes.StoreProduct }) {
  const specs = ((product.metadata as any)?.specs as Spec[]) || []
  if (!specs.length) return null

  return (
    <section className="content-container my-16 small:my-24" aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="font-heading text-2xl small:text-3xl font-bold tracking-tight text-aquora-ink mb-6">
        Specifications
      </h2>
      <div className="max-w-3xl rounded-large border border-black/10 overflow-hidden">
        <dl className="divide-y divide-black/5">
          {specs.map((s, i) => (
            <div key={`${s.name}-${i}`} className="grid grid-cols-[1fr_1.2fr] gap-4 px-5 py-3 odd:bg-aquora-surface/60">
              <dt className="text-sm text-aquora-muted">{s.name}</dt>
              <dd className="text-sm font-semibold text-aquora-ink">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
