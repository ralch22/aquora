// Guest-friendly product comparison tray persisted in localStorage (no login required). Emits a
// window event on every change so the card toggles + the floating compare bar stay in sync across
// the app, and across tabs via the native `storage` event. Hard-capped at 4 items (a readable
// side-by-side table); adding a 5th is rejected so the UI can warn the shopper.

const KEY = "aq_compare"
export const COMPARE_EVENT = "aq:compare"
export const COMPARE_MAX = 4

export function getCompare(): string[] {
  if (typeof window === "undefined") return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]")
    return Array.isArray(v) ? (v as string[]).slice(0, COMPARE_MAX) : []
  } catch {
    return []
  }
}

function save(list: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, COMPARE_MAX)))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent(COMPARE_EVENT))
  } catch {}
}

export function inCompare(handle: string): boolean {
  return getCompare().includes(handle)
}

export function compareCount(): number {
  return getCompare().length
}

export function isCompareFull(): boolean {
  return getCompare().length >= COMPARE_MAX
}

// Toggle a handle in/out of the tray. Returns the resulting state:
//  - "added"   → now being compared
//  - "removed" → taken out
//  - "full"    → not added because the tray already holds COMPARE_MAX items (UI should warn)
export function toggleCompare(handle: string): "added" | "removed" | "full" {
  if (!handle) return "removed"
  const list = getCompare()
  const i = list.indexOf(handle)
  if (i >= 0) {
    list.splice(i, 1)
    save(list)
    return "removed"
  }
  if (list.length >= COMPARE_MAX) return "full"
  list.push(handle)
  save(list)
  return "added"
}

export function removeFromCompare(handle: string): void {
  save(getCompare().filter((h) => h !== handle))
}

export function clearCompare(): void {
  save([])
}
