import React from "react"

/**
 * Branded Aquora page-header band. Two variants:
 * - "teal"    : deep teal gradient with a subtle ripple motif (hero-style)
 * - "surface" : light aquora-surface band for quieter content pages
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  variant = "teal",
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  variant?: "teal" | "surface"
}) {
  const isTeal = variant === "teal"

  return (
    <header
      className={
        "relative overflow-hidden " +
        (isTeal
          ? "bg-gradient-to-br from-aquora-secondary to-aquora-primary text-white"
          : "bg-aquora-surface text-aquora-ink border-b border-black/5")
      }
    >
      {/* Subtle ripple / wave motif */}
      <svg
        aria-hidden="true"
        className={
          "pointer-events-none absolute inset-0 h-full w-full " +
          (isTeal ? "opacity-[0.12] text-white" : "opacity-[0.06] text-aquora-primary")
        }
        preserveAspectRatio="none"
        viewBox="0 0 800 320"
        fill="none"
      >
        <path
          d="M0 220 Q 200 160 400 220 T 800 220"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 260 Q 200 200 400 260 T 800 260"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 180 Q 200 120 400 180 T 800 180"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      <div className="content-container relative py-16 small:py-24">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p
              className={
                "mb-4 text-xs font-semibold uppercase tracking-[0.18em] " +
                (isTeal ? "text-aquora-accent" : "text-aquora-primary")
              }
            >
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading text-4xl small:text-5xl font-bold tracking-tight leading-[1.05]">
            {title}
          </h1>
          {subtitle ? (
            <p
              className={
                "mt-5 text-lg leading-relaxed " +
                (isTeal ? "text-white/85" : "text-aquora-muted")
              }
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
