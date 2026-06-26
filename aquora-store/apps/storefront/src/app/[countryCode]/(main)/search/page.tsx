import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Search — Aquora",
  description: "Search Aquora's pool, spa, pond and fountain equipment catalogue.",
}

async function runSearch(q: string): Promise<{ products: any[]; source?: string }> {
  if (!q) return { products: [] }
  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  try {
    const r = await fetch(`${base}/store/search?q=${encodeURIComponent(q)}`, {
      headers: { "x-publishable-api-key": key },
      cache: "no-store",
    })
    if (!r.ok) return { products: [] }
    return await r.json()
  } catch {
    return { products: [] }
  }
}

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await props.searchParams
  const { products } = await runSearch(q.trim())

  return (
    <div className="content-container py-12 small:py-16">
      <p className="text-aquora-accent text-xs font-semibold uppercase tracking-widest mb-2">Catalogue search</p>
      <h1 className="font-heading text-[32px] leading-tight text-aquora-ink mb-1">
        {q ? <>Results for “{q}”</> : "Search the catalogue"}
      </h1>
      <p className="text-aquora-muted mb-10">
        {q ? `${products.length} product${products.length === 1 ? "" : "s"} found` : "Search across our full pool, spa, pond & fountain equipment range."}
      </p>

      {products.length > 0 && (
        <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((p) => (
            <li key={p.handle}>
              <LocalizedClientLink href={`/products/${p.handle}`} className="group block">
                <div className="aspect-square bg-aquora-surface rounded-large overflow-hidden border border-black/5">
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.title} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-aquora-muted text-xs">No image</div>
                  )}
                </div>
                <h3 className="mt-3 text-sm text-aquora-ink leading-snug line-clamp-2 group-hover:text-aquora-primary transition-colors">{p.title}</h3>
                {p.category && <p className="text-xs text-aquora-muted mt-1">{p.category}</p>}
                {p.price != null && <p className="text-sm font-semibold text-aquora-ink mt-1">AED {Number(p.price).toLocaleString("en-AE")}</p>}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      )}

      {q && products.length === 0 && (
        <div className="rounded-large border border-black/5 bg-aquora-surface p-8 text-center">
          <p className="text-aquora-ink font-heading text-lg mb-1">No matches for “{q}”.</p>
          <p className="text-aquora-muted text-sm">Try a broader term, ask <span className="text-aquora-primary font-medium">Aqua</span> (the assistant, bottom-right) to describe or photograph what you need, or <LocalizedClientLink href="/services" className="text-aquora-primary underline">request a free consultation</LocalizedClientLink>.</p>
        </div>
      )}
    </div>
  )
}
