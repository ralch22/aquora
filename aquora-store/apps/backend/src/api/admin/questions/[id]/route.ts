import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QA_MODULE } from "../../../../modules/qa"

// POST /admin/questions/:id  body { answer?, status?, answered_by? }
// Answering a question (providing `answer`) publishes it by default. Can also just set status
// (e.g. reject spam). Admin-session authenticated.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const b: any = req.body || {}
  const answer = b.answer != null ? String(b.answer).slice(0, 3000) : undefined
  const answered_by = b.answered_by != null ? String(b.answered_by).slice(0, 80) : undefined
  let status = b.status != null ? String(b.status).trim() : undefined

  if (status && !["pending", "published", "rejected"].includes(status)) {
    res.status(400).json({ error: "status must be pending, published or rejected" })
    return
  }
  // Providing an answer with no explicit status → publish it.
  if (answer && answer.trim() && !status) status = "published"

  const update: any = { id }
  if (answer !== undefined) update.answer = answer
  if (answered_by !== undefined) update.answered_by = answered_by
  if (status !== undefined) update.status = status

  try {
    const service: any = req.scope.resolve(QA_MODULE)
    await service.updateQuestions([update])
    res.json({ ok: true, id, status: update.status })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to update question" })
  }
}

// DELETE /admin/questions/:id — permanently remove a question (e.g. spam).
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  try {
    const service: any = req.scope.resolve(QA_MODULE)
    await service.deleteQuestions([id])
    res.json({ ok: true, id, deleted: true })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to delete question" })
  }
}
