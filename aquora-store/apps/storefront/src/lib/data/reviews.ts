"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type ReviewAggregate = { count: number; average: number }

// Server-side review aggregates. Used to surface REAL ratings in the Product JSON-LD and on
// product cards. Everything fails soft to "no rating" — a reviews-backend hiccup must never
// break PDP render or a grid, and we never fabricate a rating when data is missing.

// Single product aggregate (count + average) for approved reviews. Returns null when there
// are no approved reviews or on any error, so callers can simply omit the rating.
export const getReviewAggregate = async (
  productId: string
): Promise<ReviewAggregate | null> => {
  if (!productId) return null
  try {
    const next = { ...(await getCacheOptions("reviews")) }
    const { aggregate } = await sdk.client.fetch<{ aggregate: ReviewAggregate }>(
      `/store/reviews`,
      {
        method: "GET",
        query: { product_id: productId },
        next,
        cache: "force-cache",
      }
    )
    if (aggregate && aggregate.count > 0) {
      return { count: aggregate.count, average: aggregate.average }
    }
    return null
  } catch {
    return null
  }
}

// Batch aggregates for many products in ONE request (avoids per-card N+1 on grids/rails).
// Returns a map keyed by product id; products with no approved reviews are simply absent.
export const getReviewAggregates = async (
  productIds: string[]
): Promise<Record<string, ReviewAggregate>> => {
  const ids = Array.from(new Set((productIds || []).filter(Boolean)))
  if (!ids.length) return {}
  try {
    const next = { ...(await getCacheOptions("reviews")) }
    const { aggregates } = await sdk.client.fetch<{
      aggregates: Record<string, ReviewAggregate>
    }>(`/store/reviews/aggregate`, {
      method: "GET",
      query: { product_ids: ids.join(",") },
      next,
      cache: "force-cache",
    })
    return aggregates || {}
  } catch {
    return {}
  }
}
