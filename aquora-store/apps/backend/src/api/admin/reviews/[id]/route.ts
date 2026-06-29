import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../modules/review"

// POST /admin/reviews/:id  body { status: "approved" | "rejected" | "pending" }
// Moderation action for the owner (admin-session authenticated). Approving a review makes it
// public on the storefront; rejecting hides it.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const status = String((req.body as any)?.status || "").trim()
  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ error: "status must be approved, rejected or pending" })
    return
  }
  try {
    const service: any = req.scope.resolve(REVIEW_MODULE)
    await service.updateReviews([{ id, status }])
    res.json({ ok: true, id, status })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to update review" })
  }
}

// DELETE /admin/reviews/:id — permanently remove a review (e.g. spam).
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  try {
    const service: any = req.scope.resolve(REVIEW_MODULE)
    await service.deleteReviews([id])
    res.json({ ok: true, id, deleted: true })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to delete review" })
  }
}
