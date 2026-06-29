"use client"

import { useEffect, useState } from "react"

type QA = {
  id: string
  body: string
  author_name: string
  answer: string | null
  answered_by: string | null
  created_at: string
}

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

export default function Questions({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [items, setItems] = useState<QA[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<null | { ok: boolean; message: string }>(null)

  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  const load = () => {
    if (!base) return
    fetch(`${base}/store/questions?product_id=${encodeURIComponent(productId)}`, {
      headers: { "x-publishable-api-key": pk },
    })
      .then((r) => (r.ok ? r.json() : { questions: [] }))
      .then((d) => {
        setItems(d.questions || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!base || submitting) return
    if (!name.trim() || body.trim().length < 6) {
      setDone({ ok: false, message: "Please add your name and a question." })
      return
    }
    setSubmitting(true)
    setDone(null)
    try {
      const res = await fetch(`${base}/store/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": pk },
        body: JSON.stringify({
          product_id: productId,
          author_name: name.trim(),
          email: email.trim() || undefined,
          body: body.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDone({ ok: true, message: data.message || "Thanks! We'll answer your question shortly." })
        setName(""); setEmail(""); setBody("")
        setTimeout(() => setShowForm(false), 2000)
      } else {
        setDone({ ok: false, message: data.error || "Couldn't submit your question. Please try again." })
      }
    } catch {
      setDone({ ok: false, message: "Couldn't submit your question. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="questions" className="content-container my-16 small:my-24" aria-labelledby="qa-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Ask the experts
          </p>
          <h2 id="qa-heading" className="font-heading text-2xl small:text-3xl font-bold tracking-tight text-aquora-ink">
            Questions &amp; answers
          </h2>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setDone(null) }}
          className="group inline-flex items-center gap-2 rounded-full border border-aquora-primary px-5 py-2.5 text-sm font-semibold text-aquora-primary transition hover:bg-aquora-primary hover:text-white active:scale-[0.98]"
        >
          {showForm ? "Close" : "Ask a question"}
        </button>
      </div>

      {/* Ask form */}
      {showForm && (
        <form onSubmit={submit} className="mt-6 max-w-2xl rounded-[1.6rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_50px_-30px_rgba(11,31,36,0.3)] small:p-8">
          <p className="text-sm text-aquora-muted">Ask about <span className="font-semibold text-aquora-ink">{productTitle}</span> — our technical team will reply here.</p>
          <div className="mt-4 grid gap-4 small:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Your name *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Email <span className="font-normal normal-case text-aquora-muted/80">— optional, to be notified of the answer</span></span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={160}
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
            </label>
          </div>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Your question *</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={1000} rows={3}
              placeholder="e.g. Will this pump suit a 60 m³ pool with a sand filter?"
              className="resize-y rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
          </label>
          {done && (
            <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${done.ok ? "bg-aquora-primary/10 text-aquora-primary" : "bg-red-50 text-red-600"}`}>
              {done.message}
            </p>
          )}
          <div className="mt-5 flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-aquora-primary px-6 py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50">
              {submitting ? "Sending…" : "Send question"}
            </button>
            <p className="text-xs text-aquora-muted">Answered by our team, usually within 1 business day.</p>
          </div>
        </form>
      )}

      {/* Q&A list */}
      {!loading && items.length === 0 && !showForm && (
        <div className="mt-6 rounded-[1.4rem] border border-dashed border-black/10 bg-aquora-surface/40 px-6 py-8 text-center">
          <p className="text-sm font-medium text-aquora-ink">No questions yet</p>
          <p className="mt-1 text-sm text-aquora-muted">
            Not sure if this is right for your pool? Ask us — or chat with Aqua, our AI advisor, bottom-right.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mt-8 space-y-5">
          {items.map((q) => (
            <li key={q.id} className="rounded-[1.4rem] border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,36,0.04)]">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-aquora-surface text-xs font-bold text-aquora-primary">Q</span>
                <div>
                  <p className="text-sm font-semibold text-aquora-ink">{q.body}</p>
                  <p className="mt-0.5 text-xs text-aquora-muted">{q.author_name} · {fmtDate(q.created_at)}</p>
                </div>
              </div>
              {q.answer && (
                <div className="mt-3 flex items-start gap-3 rounded-[1rem] bg-aquora-surface/60 p-4">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-aquora-primary text-xs font-bold text-white">A</span>
                  <div>
                    <p className="text-sm leading-relaxed text-aquora-ink/90">{q.answer}</p>
                    <p className="mt-1 text-xs font-medium text-aquora-primary">{q.answered_by || "Aquora"}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
