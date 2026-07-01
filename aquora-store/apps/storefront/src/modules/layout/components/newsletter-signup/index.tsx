"use client"

import { useState } from "react"

// Footer newsletter capture → POST /store/newsletter (the owned list). Fail-soft: friendly inline
// states, single explicit opt-in (consent copy below the field), and no hard dependency on email
// being provisioned — a valid submit persists to the Medusa DB regardless.
export default function NewsletterSignup() {
  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<null | { ok: boolean; message: string }>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!base || submitting) return
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setDone({ ok: false, message: "Please enter a valid email address." })
      return
    }
    setSubmitting(true)
    setDone(null)
    try {
      const res = await fetch(`${base}/store/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": pk },
        body: JSON.stringify({ email: email.trim(), consent: true, source: "footer" }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDone({ ok: true, message: data.message || "Thanks — you're subscribed." })
        setEmail("")
      } else {
        setDone({ ok: false, message: data.error || "Couldn't subscribe you. Please try again." })
      }
    } catch {
      setDone({ ok: false, message: "Couldn't subscribe you. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content-container border-b border-black/5">
      <div className="flex flex-col gap-6 py-12 medium:flex-row medium:items-center medium:justify-between">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Pool-care tips &amp; offers
          </span>
          <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-aquora-ink small:text-2xl">
            Stay in the loop
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-aquora-muted">
            Seasonal maintenance guides, new equipment and the occasional offer — straight to your inbox. No spam.
          </p>
        </div>
        <form onSubmit={submit} className="w-full max-w-md" noValidate>
          <div className="flex flex-col gap-3 small:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={160}
              className="w-full flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-aquora-ink outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-aquora-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-aquora-secondary active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Subscribing…" : "Subscribe"}
            </button>
          </div>
          {done ? (
            <p className={`mt-3 text-sm ${done.ok ? "text-aquora-primary" : "text-red-600"}`} role="status">
              {done.message}
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-aquora-muted">
              By subscribing you agree to receive Aquora emails. Unsubscribe anytime.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
