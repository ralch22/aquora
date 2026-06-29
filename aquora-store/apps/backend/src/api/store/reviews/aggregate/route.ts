import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../modules/review"

type AggRow = { product_id: string; rating: number }
type Aggregate = { count: number; average: number }

// GET /store/reviews/aggregate?product_ids=prod_a,prod_b,prod_c
// Returns { [product_id]: { count, average } } for APPROVED reviews only, computed in one query.
// Products with no approved reviews are simply absent from the map (never a fabricated zero rating).
// Lets a product grid/rail fetch ratings once per page instead of one request per card.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const ids = String(req.query.product_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  if (!ids.length) {
    res.json({ aggregates: {} })
    return
  }

  try {
    const service: any = req.scope.resolve(REVIEW_MODULE)
    const rows: AggRow[] = await service.listReviews(
      { product_id: ids, status: "approved" },
      { take: 5000, select: ["product_id", "rating"] }
    )

    const sums: Record<string, { sum: number; count: number }> = {}
    for (const r of rows) {
      const pid = r.product_id
      if (!sums[pid]) sums[pid] = { sum: 0, count: 0 }
      sums[pid].sum += Number(r.rating || 0)
      sums[pid].count += 1
    }

    const aggregates: Record<string, Aggregate> = {}
    for (const [pid, { sum, count }] of Object.entries(sums)) {
      if (count > 0) {
        aggregates[pid] = { count, average: Math.round((sum / count) * 10) / 10 }
      }
    }

    res.json({ aggregates })
  } catch (e) {
    console.warn(`[reviews] aggregate GET error: ${(e as Error)?.message || e}`)
    res.json({ aggregates: {} })
  }
}
