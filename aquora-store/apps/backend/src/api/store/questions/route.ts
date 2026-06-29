import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { QA_MODULE } from "../../../modules/qa"
import { sendEmail, emailEnabled } from "../../../lib/email"

type QRow = {
  id: string
  body: string
  author_name: string
  answer: string | null
  answered_by: string | null
  created_at: Date
}

// GET /store/questions?product_id=prod_xxx
// Returns PUBLISHED questions (i.e. ones the owner has answered) for a product. Pending/rejected
// stay private.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = String(req.query.product_id || "").trim()
  if (!productId) {
    res.json({ questions: [], count: 0 })
    return
  }
  try {
    const service: any = req.scope.resolve(QA_MODULE)
    const rows: QRow[] = await service.listQuestions(
      { product_id: productId, status: "published" },
      { order: { created_at: "DESC" }, take: 100 }
    )
    const questions = rows.map((q) => ({
      id: q.id,
      body: q.body,
      author_name: q.author_name,
      answer: q.answer,
      answered_by: q.answered_by || "Aquora",
      created_at: q.created_at,
    }))
    res.json({ questions, count: questions.length })
  } catch (e) {
    console.warn(`[qa] GET error: ${(e as Error)?.message || e}`)
    res.json({ questions: [], count: 0 })
  }
}

function clean(s: any, max: number): string {
  return String(s ?? "")
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .trim()
    .slice(0, max)
}

// POST /store/questions — ask a question. Body { product_id, body, author_name, email? }.
// Stored as `pending`; the owner is emailed so they can answer it in the admin (answering
// publishes it). No question is ever auto-published.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const product_id = clean(b.product_id, 80)
  const body = clean(b.body, 1000)
  const author_name = clean(b.author_name, 80)
  const email = b.email ? clean(b.email, 160).toLowerCase() : null

  if (!product_id || !author_name || body.length < 6) {
    res.status(400).json({ error: "Please add your name and a question (at least a few words)." })
    return
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." })
    return
  }

  try {
    const service: any = req.scope.resolve(QA_MODULE)
    const [created] = await service.createQuestions([
      { product_id, body, author_name, email, status: "pending" },
    ])

    // Notify the owner so they can answer (best-effort, never blocks the response).
    if (emailEnabled()) {
      const store = (process.env.STOREFRONT_URL || "https://aquora.ae").replace(/\/+$/, "")
      sendEmail({
        to: process.env.CONTACT_TO || "hello@aquora.ae",
        subject: `New product question from ${author_name}`,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0B1F24;">
          <p><strong>${author_name}</strong>${email ? ` (${email})` : ""} asked a question:</p>
          <blockquote style="border-left:3px solid #0E6E73;margin:12px 0;padding:6px 14px;color:#0B1F24;">${body}</blockquote>
          <p style="color:#6E8C90;">Product: ${product_id}</p>
          <p><a href="${store.replace("https://aquora.ae", "https://api.aquora.ae")}/app/questions" style="color:#0E6E73;font-weight:600;">Answer it in the Aquora admin →</a></p>
        </div>`,
        replyTo: email || undefined,
      }).catch(() => {})
    }

    res.status(201).json({
      ok: true,
      id: created?.id,
      message: "Thanks! Your question has been sent to our team — we'll answer it here shortly.",
    })
  } catch (e) {
    console.warn(`[qa] POST error: ${(e as Error)?.message || e}`)
    res.status(500).json({ error: "Couldn't submit your question right now. Please try again shortly." })
  }
}
