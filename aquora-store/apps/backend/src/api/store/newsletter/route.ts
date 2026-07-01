import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_MODULE } from "../../../modules/newsletter"

function clean(s: any, max: number): string {
  return String(s ?? "")
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .trim()
    .slice(0, max)
}

// Best-effort mirror of a new subscriber into a Resend Audience (the "owned list" in Resend).
// Fail-soft: a no-op unless BOTH RESEND_API_KEY and RESEND_AUDIENCE_ID are set. The Medusa DB is
// always the source of truth; this never blocks or fails the signup.
async function mirrorToResend(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  const audience = process.env.RESEND_AUDIENCE_ID
  if (!key || !audience) return
  try {
    await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false }),
    })
  } catch {
    /* fail-soft: DB row already persisted */
  }
}

// POST /store/newsletter — subscribe an email to the Aquora list. Body { email, consent?, source? }.
// Idempotent: an already-subscribed email returns a friendly 200 (never a 500), so re-submits and
// unique-constraint races read as success. Public (publishable-key) + rate-limited in middlewares.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const b: any = req.body || {}
  const email = clean(b.email, 160).toLowerCase()
  const consent = b.consent !== false // footer form is an explicit opt-in; default true
  const source = clean(b.source, 40) || "footer"

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." })
    return
  }

  try {
    const service: any = req.scope.resolve(NEWSLETTER_MODULE)

    // Already on the list? Return a friendly success rather than tripping the unique constraint.
    const existing = await service.listSubscribers({ email }, { take: 1 })
    if (existing?.length) {
      res.status(200).json({ ok: true, message: "You're already on the list — thank you!" })
      return
    }

    await service.createSubscribers([{ email, consent, source }])
    void mirrorToResend(email)

    res.status(201).json({
      ok: true,
      message: "Thanks — you're subscribed. Watch for pool-care tips and the occasional offer.",
    })
  } catch (e: any) {
    // Two rapid submits can race past the existence check → unique violation. Treat as success.
    const msg = String(e?.message || e).toLowerCase()
    if (e?.code === "23505" || msg.includes("unique") || msg.includes("duplicate")) {
      res.status(200).json({ ok: true, message: "You're already on the list — thank you!" })
      return
    }
    console.warn(`[newsletter] POST error: ${e?.message || e}`)
    res.status(500).json({ error: "Couldn't subscribe you right now. Please try again shortly." })
  }
}
