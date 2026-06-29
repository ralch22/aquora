import type { ReviewAggregate } from "@lib/data/reviews"

const ACCENT = "#E0A23B"

// Compact, server-rendered star + count for a product card. Renders nothing unless there is at
// least one real approved review — we never show "0 reviews" or placeholder stars (no fabrication).
export default function CardRating({ rating }: { rating?: ReviewAggregate | null }) {
  if (!rating || rating.count < 1) return null

  // Rounded to nearest half for display.
  const v = Math.round(rating.average * 2) / 2

  return (
    <div
      className="mt-1.5 flex items-center gap-1.5"
      aria-label={`Rated ${rating.average} out of 5 from ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0
          return (
            <svg key={i} width={12} height={12} viewBox="0 0 24 24" className="shrink-0">
              <defs>
                <linearGradient id={`cr-${i}-${fill}`}>
                  <stop offset={`${fill * 100}%`} stopColor={ACCENT} />
                  <stop offset={`${fill * 100}%`} stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.4l-5.81 3.06 1.11-6.47-4.7-4.58 6.5-.95z"
                fill={fill ? `url(#cr-${i}-${fill})` : "none"}
                stroke={ACCENT}
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          )
        })}
      </span>
      <span className="text-[11px] font-medium text-aquora-muted">({rating.count})</span>
    </div>
  )
}
