import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendEmail, emailEnabled } from "../../../lib/email"

const INK = "#0B1F24"
const MUTED = "#6E8C90"
const TEAL = "#0E6E73"

// Public store route for the storefront contact form. Emails the enquiry to the team via
// Resend (env-gated). No-op-safe: if RESEND_API_KEY is unset it logs and still returns ok so
// the form never appears broken before email is provisioned.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { name, email, phone, message } = (req.body || {}) as Record<string, string>

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: "Please provide your name, email and a message." })
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." })
  }

  const to = process.env.CONTACT_TO || "hello@aquora.ae"
  const esc = (s: string) => String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:${INK};">
      <h2 style="color:${TEAL};">New website enquiry</h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      ${phone ? `<p><strong>Phone:</strong> ${esc(phone)}</p>` : ""}
      <p style="margin-top:16px;"><strong>Message</strong></p>
      <p style="white-space:pre-wrap;color:${MUTED};">${esc(message)}</p>
    </div>`

  try {
    if (emailEnabled()) {
      await sendEmail({ to, subject: `New enquiry from ${name}`, html, replyTo: email })
    } else {
      console.log("[contact] email disabled — enquiry received:", { name, email, phone })
    }
  } catch {
    // best-effort
  }

  return res.json({ ok: true })
}
