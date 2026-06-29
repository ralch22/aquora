"use client"

import { useSearchParams } from "next/navigation"

// Lightweight checkout progress indicator driven by the same `?step=` param the section
// components use. Gives the shopper "where am I / how much is left" — a known reducer of
// "too long / complicated checkout" abandonment. Renders inline (no streamed Suspense).
const STEPS = [
  { key: "address", label: "Address" },
  { key: "delivery", label: "Delivery" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
] as const

export default function CheckoutSteps() {
  const params = useSearchParams()
  const current = params.get("step") || "address"
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.key === current)
  )

  return (
    <nav aria-label="Checkout progress" className="mb-2">
      <ol className="flex items-center gap-1.5 small:gap-3">
        {STEPS.map((step, i) => {
          const state = i < activeIndex ? "done" : i === activeIndex ? "current" : "todo"
          const chip =
            state === "done"
              ? "bg-aquora-primary text-white"
              : state === "current"
              ? "bg-aquora-secondary text-white ring-4 ring-aquora-secondary/12"
              : "bg-aquora-surface text-aquora-muted ring-1 ring-black/[0.06]"
          const label =
            state === "todo" ? "text-aquora-muted" : "text-aquora-ink font-semibold"
          return (
            <li key={step.key} className="flex flex-1 items-center gap-1.5 small:gap-3">
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition-colors duration-300 ${chip}`}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {state === "done" ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 8.5l3 3 7-7.5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={`hidden text-sm small:inline ${label}`}>{step.label}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`h-px flex-1 rounded-full transition-colors duration-300 ${
                    i < activeIndex ? "bg-aquora-primary/40" : "bg-black/[0.08]"
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
      {/* current step label on mobile (labels are hidden inline below small:) */}
      <p className="mt-2 text-sm font-semibold text-aquora-ink small:hidden">
        Step {activeIndex + 1} of {STEPS.length} · {STEPS[activeIndex].label}
      </p>
    </nav>
  )
}
