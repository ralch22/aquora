"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter()
  const params = useParams() as { countryCode?: string }
  const countryCode = params.countryCode || "ae"
  const [q, setQ] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    if (query) router.push(`/${countryCode}/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={submit} className={className}>
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search pumps, filters, heating…"
          aria-label="Search products"
          className="h-9 w-44 medium:w-60 rounded-full border border-black/10 bg-aquora-surface pl-9 pr-3 text-sm text-aquora-ink placeholder:text-aquora-muted focus:outline-none focus:border-aquora-primary focus:w-64 transition-all"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-aquora-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
    </form>
  )
}
