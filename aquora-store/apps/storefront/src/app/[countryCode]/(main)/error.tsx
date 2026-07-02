"use client"

import { useEffect } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Section error boundary for the main shopping experience. Catching errors here (instead
// of letting them bubble to global-error.tsx) keeps the nav + footer chrome around the
// fallback so a rendering hiccup on one page never looks like the whole site went down.
// Mirrors global-error's deploy-time ChunkLoadError auto-reload (same sessionStorage
// counter, so combined attempts stay capped at 2 site-wide).
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isChunkError =
    error?.name === "ChunkLoadError" ||
    /chunk|dynamically imported module|importing a module script|Loading CSS chunk|error loading dynamically/i.test(
      error?.message || ""
    )

  useEffect(() => {
    if (!isChunkError || typeof window === "undefined") return
    try {
      const n = Number(sessionStorage.getItem("aq_chunk_reload_n") || 0)
      if (n < 2) {
        sessionStorage.setItem("aq_chunk_reload_n", String(n + 1))
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }, [isChunkError])

  return (
    <div className="content-container flex flex-col items-center py-24 text-center small:py-32">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aquora-accentdark">
        {isChunkError ? "Updating" : "Something went wrong"}
      </p>
      <h1 className="mt-3 max-w-xl text-2xl font-bold text-aquora-ink small:text-3xl">
        {isChunkError
          ? "We just shipped an update"
          : "That didn't go as planned"}
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-aquora-muted">
        {isChunkError
          ? "Reloading to get you the latest version of the store."
          : "An unexpected error occurred while loading this page. Your cart is safe — try again, or head back to the store."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center rounded-full bg-aquora-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-aquora-secondary"
        >
          Try again
        </button>
        <LocalizedClientLink
          href="/store"
          className="inline-flex items-center rounded-full border border-black/10 px-6 py-2.5 text-sm font-semibold text-aquora-ink transition hover:border-aquora-primary hover:text-aquora-primary"
        >
          Back to the store
        </LocalizedClientLink>
      </div>
    </div>
  )
}
