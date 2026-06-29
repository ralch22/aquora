"use client"

import { useEffect } from "react"

// Root error boundary. Its main job is to make DEPLOY-TIME chunk errors invisible: when we
// ship a new build, a shopper already on the old version can hit a ChunkLoadError on their
// next navigation/interaction (a JS chunk the new build replaced 404s) — Next would otherwise
// show "Application error: a client-side exception". Here we detect that and auto-reload once
// (timestamp-guarded so it can recover on every future deploy but never loops) to fetch the
// fresh chunks. Any other error gets a clean branded fallback instead of a raw stack.
export default function GlobalError({
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
      // Count attempts (not just time): if the FRESH chunks still throw a ChunkLoadError
      // (a genuinely broken deploy), stop after 2 reloads and show the manual fallback so we
      // never slow-loop the shopper.
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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#F4F8F8",
          color: "#0B1F24",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 .5rem" }}>
            {isChunkError ? "Updating…" : "Something went wrong"}
          </h1>
          <p style={{ color: "#6E8C90", margin: "0 0 1.25rem", fontSize: ".95rem", lineHeight: 1.5 }}>
            {isChunkError
              ? "We just shipped an update — reloading to get the latest version."
              : "Sorry, an unexpected error occurred. Please try again."}
          </p>
          <button
            onClick={() =>
              typeof window !== "undefined" ? window.location.reload() : reset()
            }
            style={{
              background: "#0E6E73",
              color: "#fff",
              border: 0,
              borderRadius: 9999,
              padding: ".6rem 1.4rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
