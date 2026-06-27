// Minimal Resend email client. Env-gated: no-op (returns false) unless RESEND_API_KEY is set,
// so the backend ships and runs safely before the owner provisions email. Sender comes from
// RESEND_FROM (must be a verified Resend domain), defaulting to a Resend onboarding address.
type SendArgs = { to: string; subject: string; html: string; replyTo?: string }

export const emailEnabled = () => !!process.env.RESEND_API_KEY

export async function sendEmail({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const from = process.env.RESEND_FROM || "Aquora <onboarding@resend.dev>"
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    })
    return r.ok
  } catch {
    return false
  }
}
