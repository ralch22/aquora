"use client"

import { useEffect, useState } from "react"
import { inCompare, toggleCompare, COMPARE_EVENT, COMPARE_MAX } from "@lib/aquora/compare"
import { toast } from "@modules/common/components/toast"

// "Add to compare" toggle for product cards (floating overlay, sits below the wishlist heart)
// and the PDP. Guest-friendly (localStorage), stays in sync via the compare change event.
// Stops link navigation when placed on a card.
export default function CompareButton({
  handle,
  floating = false,
  className = "",
}: {
  handle: string
  floating?: boolean
  className?: string
}) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => setActive(inCompare(handle))
    sync()
    window.addEventListener(COMPARE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [handle])

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from comparison" : "Add to comparison"}
      title={active ? "In compare" : "Compare"}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const r = toggleCompare(handle)
        if (r === "full") {
          toast.error("Compare is full", `You can compare up to ${COMPARE_MAX} products at once.`)
          return
        }
        setActive(r === "added")
      }}
      className={`${
        floating
          ? `absolute right-2.5 top-[3.4rem] z-10 grid h-9 w-9 place-items-center rounded-full border backdrop-blur shadow-sm transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-aquora-primary ${
              active
                ? "border-aquora-primary/40 bg-aquora-primary text-white"
                : "border-black/[0.06] bg-white/90 text-aquora-ink hover:text-aquora-primary"
            }`
          : `inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-aquora-primary ${
              active
                ? "border-aquora-primary bg-aquora-primary text-white"
                : "border-black/10 text-aquora-ink hover:border-aquora-primary hover:text-aquora-primary"
            }`
      } ${className}`}
    >
      <svg
        width={floating ? 17 : 18}
        height={floating ? 17 : 18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7 4v16M17 4v16" />
        <path d="M3.5 8.5 7 5l3.5 3.5M20.5 15.5 17 19l-3.5-3.5" />
      </svg>
      {!floating && <span>{active ? "Comparing" : "Compare"}</span>}
    </button>
  )
}
