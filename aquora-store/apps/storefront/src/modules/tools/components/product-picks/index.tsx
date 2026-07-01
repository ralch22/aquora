"use client"

import { useEffect, useState } from "react"
import { fetchPicks, type PickCard } from "./fetch"
import FlatCardGrid from "./FlatCardGrid"

// Client variant — for the interactive tools (problem solver, dosing calculator) which are
// already client trees. Fetches on mount / when the source changes; self-hides while empty.
export default function ProductPicks({
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
  const [products, setProducts] = useState<PickCard[]>([])
  useEffect(() => {
    let alive = true
    setProducts([])
    fetchPicks(source, limit)
      .then((p) => alive && setProducts(p))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [source, limit])
  if (!products.length) return null
  return <FlatCardGrid products={products} eyebrow={eyebrow} title={title} cols={cols} />
}
