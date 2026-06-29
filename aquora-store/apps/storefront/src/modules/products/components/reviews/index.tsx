"use client"

import { useEffect, useMemo, useState } from "react"

type Review = {
  id: string
  rating: number
  title: string | null
  body: string
  author_name: string
  verified: boolean
  created_at: string
}
type Aggregate = { count: number; average: number; distribution: Record<string, number> }

const ACCENT = "#E0A23B"

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  // Rounded to nearest half for display.
  const v = Math.round(value * 2) / 2
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <defs>
              <linearGradient id={`hg-${i}-${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor={ACCENT} />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z"
              fill={fill ? `url(#hg-${i}-${fill})` : "none"}
              stroke={ACCENT}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </span>
  )
}

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("en-AE", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

export default function Reviews({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [agg, setAgg] = useState<Aggregate>({ count: 0, average: 0, distribution: {} })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // form state
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [order, setOrder] = useState("")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<null | { ok: boolean; message: string }>(null)

  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const pk = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  const load = useMemo(
    () => () => {
      if (!base) return
      fetch(`${base}/store/reviews?product_id=${encodeURIComponent(productId)}`, {
        headers: { "x-publishable-api-key": pk },
      })
        .then((r) => (r.ok ? r.json() : { reviews: [], aggregate: { count: 0, average: 0, distribution: {} } }))
        .then((d) => {
          setReviews(d.reviews || [])
          setAgg(d.aggregate || { count: 0, average: 0, distribution: {} })
          setLoading(false)
        })
        .catch(() => setLoading(false))
    },
    [base, pk, productId]
  )

  useEffect(() => {
    load()
  }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!base || submitting) return
    if (!(rating >= 1) || !name.trim() || body.trim().length < 4) {
      setDone({ ok: false, message: "Please add your name, a star rating and a short review." })
      return
    }
    setSubmitting(true)
    setDone(null)
    try {
      const res = await fetch(`${base}/store/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": pk },
        body: JSON.stringify({
          product_id: productId,
          rating,
          author_name: name.trim(),
          email: email.trim() || undefined,
          order_id: order.trim() || undefined,
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDone({ ok: true, message: data.message || "Thank you! Your review has been submitted." })
        setRating(0); setName(""); setEmail(""); setOrder(""); setTitle(""); setBody("")
        load() // refresh (verified reviews appear immediately)
        setTimeout(() => setShowForm(false), 1800)
      } else {
        setDone({ ok: false, message: data.error || "Couldn't submit your review. Please try again." })
      }
    } catch {
      setDone({ ok: false, message: "Couldn't submit your review. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  const maxBar = Math.max(1, ...Object.values(agg.distribution || {}))

  return (
    <section id="reviews" className="content-container my-16 small:my-24" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="reviews-heading" className="font-heading text-2xl small:text-3xl font-bold tracking-tight text-aquora-ink">
          Customer reviews
        </h2>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setDone(null) }}
          className="group inline-flex items-center gap-2 rounded-full border border-aquora-primary px-5 py-2.5 text-sm font-semibold text-aquora-primary transition hover:bg-aquora-primary hover:text-white active:scale-[0.98]"
        >
          {showForm ? "Close" : "Write a review"}
        </button>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-8 small:grid-cols-[auto_1fr] small:items-center">
        {agg.count > 0 ? (
          <>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <div className="font-heading text-5xl font-bold text-aquora-ink">{agg.average.toFixed(1)}</div>
                <div className="mt-1"><Stars value={agg.average} size={18} /></div>
                <div className="mt-1 text-xs text-aquora-muted">{agg.count} {agg.count === 1 ? "review" : "reviews"}</div>
              </div>
            </div>
            <div className="max-w-md space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => {
                const n = agg.distribution?.[String(s)] || 0
                return (
                  <div key={s} className="flex items-center gap-3 text-xs text-aquora-muted">
                    <span className="w-8 shrink-0 text-right">{s}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-aquora-surface">
                      <span className="block h-full rounded-full bg-aquora-accent transition-all duration-700" style={{ width: `${(n / maxBar) * 100}%` }} />
                    </span>
                    <span className="w-6 shrink-0">{n}</span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          !loading && !showForm && (
            <div className="small:col-span-2 rounded-[1.4rem] border border-dashed border-black/10 bg-aquora-surface/40 px-6 py-8 text-center">
              <Stars value={0} size={20} />
              <p className="mt-3 text-sm font-medium text-aquora-ink">No reviews yet</p>
              <p className="mt-1 text-sm text-aquora-muted">Own this product? Be the first to share your experience.</p>
            </div>
          )
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="mt-8 max-w-2xl rounded-[1.6rem] border border-black/[0.06] bg-white p-6 shadow-[0_18px_50px_-30px_rgba(11,31,36,0.3)] small:p-8">
          <p className="text-sm text-aquora-muted">Reviewing <span className="font-semibold text-aquora-ink">{productTitle}</span></p>
          {/* star picker */}
          <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={rating === i}
                aria-label={`${i} star${i > 1 ? "s" : ""}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <svg width="30" height="30" viewBox="0 0 24 24" fill={(hover || rating) >= i ? ACCENT : "none"} stroke={ACCENT} strokeWidth="1.3" strokeLinejoin="round">
                  <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z" />
                </svg>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 small:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Your name *</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Email (private)</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={160}
                className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
            </label>
          </div>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Order number <span className="font-normal normal-case text-aquora-muted/80">— optional, unlocks a Verified Purchase badge</span></span>
            <input value={order} onChange={(e) => setOrder(e.target.value)} maxLength={80} placeholder="e.g. 1042"
              className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
          </label>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Headline</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Sum it up in a few words"
              className="rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none transition focus:border-aquora-primary focus:ring-2 focus:ring-aquora-primary/20" />
          </label>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Your review *</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} rows={4}
              placeholder="What did you think? How did it perform?"
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
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <p className="text-xs text-aquora-muted">Reviews are moderated. Verified purchases appear instantly.</p>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <ul className="mt-10 grid gap-6 small:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-[1.4rem] border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,36,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                {r.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-aquora-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-aquora-primary">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 8.5l3 3 7-7.5" />
                    </svg>
                    Verified Purchase
                  </span>
                )}
              </div>
              {r.title && <h3 className="mt-2.5 text-sm font-bold text-aquora-ink">{r.title}</h3>}
              <p className="mt-1.5 text-sm leading-relaxed text-aquora-ink/85">{r.body}</p>
              <p className="mt-3 text-xs text-aquora-muted">{r.author_name} · {fmtDate(r.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
