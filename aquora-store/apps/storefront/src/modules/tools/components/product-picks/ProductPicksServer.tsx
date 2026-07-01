import { fetchPicks } from "./fetch"
import FlatCardGrid from "./FlatCardGrid"

// Server variant — awaits the fetch at render for content pages (guides, Pool Care hub).
// Self-hides (returns null) when nothing relevant is stocked, so no empty tiles ship.
export default async function ProductPicksServer({
  source,
  limit = 4,
  eyebrow,
  title,
  cols,
}: {
  source: string
  limit?: number
  eyebrow?: string
  title?: string
  cols?: 2 | 3 | 4
}) {
  const products = await fetchPicks(source, limit)
  if (!products.length) return null
  return <FlatCardGrid products={products} eyebrow={eyebrow} title={title} cols={cols} />
}
