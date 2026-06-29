"use client"

import { useEffect, useState } from "react"
import { inWishlist, toggleWishlist, WISHLIST_EVENT } from "@lib/aquora/wishlist"

// Heart toggle for product cards (floating overlay) + PDP. Guest-friendly (localStorage),
// stays in sync via the wishlist change event. Stops link navigation when placed on a card.
export default function WishlistButton({
  handle,
  floating = false,
  className = "",
}: {
  handle: string
  floating?: boolean
  className?: string
}) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const sync = () => setSaved(inWishlist(handle))
    sync()
    window.addEventListener(WISHLIST_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [handle])

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      title={saved ? "Saved" : "Save to wishlist"}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSaved(toggleWishlist(handle))
      }}
      className={`${
        floating
          ? "absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/[0.06] bg-white/90 text-aquora-ink shadow-sm backdrop-blur transition hover:scale-105 hover:text-aquora-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-aquora-accent"
          : "grid h-11 w-11 place-items-center rounded-full border border-black/10 text-aquora-ink transition hover:border-aquora-accent hover:text-aquora-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-aquora-accent"
      } ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "#E0A23B" : "none"}
        stroke={saved ? "#E0A23B" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  )
}
