// Guest-friendly wishlist persisted in localStorage (no login required). Emits a window event
// on every change so the heart buttons + the header count stay in sync across the app, and
// across tabs via the native `storage` event. Capped at 100 items.

const KEY = "aq_wishlist"
export const WISHLIST_EVENT = "aq:wishlist"

export function getWishlist(): string[] {
  if (typeof window === "undefined") return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]")
    return Array.isArray(v) ? (v as string[]) : []
  } catch {
    return []
  }
}

function save(list: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT))
  } catch {}
}

export function inWishlist(handle: string): boolean {
  return getWishlist().includes(handle)
}

// Toggle a handle; returns the new saved-state (true = now in the wishlist).
export function toggleWishlist(handle: string): boolean {
  if (!handle) return false
  const list = getWishlist()
  const i = list.indexOf(handle)
  if (i >= 0) {
    list.splice(i, 1)
    save(list)
    return false
  }
  list.unshift(handle)
  save(list)
  return true
}

export function removeFromWishlist(handle: string): void {
  save(getWishlist().filter((h) => h !== handle))
}

export function wishlistCount(): number {
  return getWishlist().length
}
