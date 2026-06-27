"use client"

import { useState } from "react"
import { Button } from "@modules/common/components/ui"
import { submitContact } from "./actions"

const field =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-aquora-ink placeholder:text-aquora-muted/60 outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/15"
const label = "text-xs font-semibold uppercase tracking-wider text-aquora-ink"

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })

  const upd =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("sending")
    setError(null)
    const res = await submitContact(form)
    if (res.ok) {
      setStatus("sent")
      setForm({ name: "", email: "", phone: "", message: "" })
    } else {
      setStatus("error")
      setError(res.error || "Something went wrong. Please try again.")
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[1.5rem] border border-aquora-primary/20 bg-aquora-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aquora-primary/10 text-aquora-primary">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-heading text-xl font-bold text-aquora-ink">Message sent</h3>
        <p className="mt-2 text-sm text-aquora-muted">
          Thanks for reaching out — our team will get back to you shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-aquora-primary hover:underline"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 small:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="c-name">Name</label>
          <input id="c-name" required value={form.name} onChange={upd("name")} className={field} placeholder="Your name" />
        </div>
        <div className="flex flex-col gap-2">
          <label className={label} htmlFor="c-email">Email</label>
          <input id="c-email" type="email" required value={form.email} onChange={upd("email")} className={field} placeholder="you@email.com" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className={label} htmlFor="c-phone">Phone <span className="font-normal text-aquora-muted normal-case">(optional)</span></label>
        <input id="c-phone" value={form.phone} onChange={upd("phone")} className={field} placeholder="+971 …" />
      </div>
      <div className="flex flex-col gap-2">
        <label className={label} htmlFor="c-message">How can we help?</label>
        <textarea id="c-message" required rows={5} value={form.message} onChange={upd("message")} className={field + " resize-y"} placeholder="Tell us about your pool, spa or project…" />
      </div>

      {status === "error" && error && (
        <p className="text-sm text-rose-600">{error}</p>
      )}

      <Button type="submit" disabled={status === "sending"} isLoading={status === "sending"} size="large">
        Send message
      </Button>
      <p className="text-xs text-aquora-muted">
        Prefer email? Write to{" "}
        <a href="mailto:hello@aquora.ae" className="text-aquora-primary hover:underline">hello@aquora.ae</a>.
      </p>
    </form>
  )
}
