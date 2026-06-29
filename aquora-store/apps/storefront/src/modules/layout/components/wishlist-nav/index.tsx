"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { wishlistCount, WISHLIST_EVENT } from "@lib/aquora/wishlist"

// Header wishlist link with a live saved-count badge (kept in sync via the wishlist event +
// cross-tab storage event).
export default function WishlistNav() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const sync = () => setCount(wishlistCount())
    sync()
    window.addEventListener(WISHLIST_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <LocalizedClientLink
      href="/wishlist"
      aria-label={count ? `Wishlist, ${count} saved` : "Wishlist"}
      data-testid="nav-wishlist-link"
      className="relative flex items-center text-aquora-ink/80 transition-colors duration-150 hover:text-aquora-primary"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 grid h-4 min-w-[1rem] place-items-center rounded-full bg-aquora-accent px-1 text-[10px] font-bold leading-none text-aquora-ink">
          {count}
        </span>
      )}
    </LocalizedClientLink>
  )
}
