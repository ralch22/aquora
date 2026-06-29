import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QA_MODULE } from "../../../modules/qa"

// GET /admin/questions?status=pending — the answer/moderation queue (admin-session authenticated).
// Defaults to pending so unanswered questions are one call away.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const status = String(req.query.status || "pending").trim()
  const productId = String(req.query.product_id || "").trim()
  const filters: any = {}
  if (status && status !== "all") filters.status = status
  if (productId) filters.product_id = productId
  try {
    const service: any = req.scope.resolve(QA_MODULE)
    const [questions, count] = await service.listAndCountQuestions(filters, {
      order: { created_at: "DESC" },
      take: 200,
    })
    res.json({ questions, count })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to list questions" })
  }
}
