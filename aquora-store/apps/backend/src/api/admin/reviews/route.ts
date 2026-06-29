import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"

// GET /admin/reviews?status=pending — moderation queue for the owner. Admin routes are
// authenticated by Medusa's admin session automatically. Defaults to pending so the queue of
// reviews awaiting approval is one call away.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const status = String(req.query.status || "pending").trim()
  const productId = String(req.query.product_id || "").trim()
  const filters: any = {}
  if (status && status !== "all") filters.status = status
  if (productId) filters.product_id = productId
  try {
    const service: any = req.scope.resolve(REVIEW_MODULE)
    const [reviews, count] = await service.listAndCountReviews(filters, {
      order: { created_at: "DESC" },
      take: 200,
    })
    res.json({ reviews, count })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to list reviews" })
  }
}
