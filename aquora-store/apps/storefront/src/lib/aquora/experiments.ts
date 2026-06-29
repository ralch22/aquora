// Lightweight, dependency-free A/B harness. Buckets each visitor deterministically by
// hashing their stable visitor id (aq_vid, shared with Retail/Ask Aqua) against an
// experiment key, so the same visitor always lands in the same variant across reloads.
// The assignment is mirrored into a cookie so it stays stable even if variant weights or
// order change later. All bucketing is client-side (aq_vid lives in localStorage); the
// server has no visitor id, so SSR always renders the control — see useExperiment for how
// that stays hydration-safe. NO streamed Suspense is involved: variants render inline.

import { getVisitorId } from "./retail-track"

export type Variant = { id: string } & Record<string, unknown>

// An experiment is its key, an enabled flag (flip to false to fully retire it — control
// renders with zero residual events), and its variants. variants[0] is ALWAYS the control.
export type Experiment<V extends Variant = Variant> = {
  key: string
  enabled: boolean
  variants: readonly V[]
}

const COOKIE = "aq_exp"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days

// FNV-1a (32-bit) — small, fast, dependency-free, good spread for short ids.
function hashString(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function readAssignments(): Record<string, string> {
  if (typeof document === "undefined") return {}
  try {
    const m = document.cookie.match(/(?:^|;\s*)aq_exp=([^;]+)/)
    if (!m) return {}
    return JSON.parse(decodeURIComponent(m[1])) as Record<string, string>
  } catch {
    return {}
  }
}

function writeAssignment(key: string, variantId: string): void {
  if (typeof document === "undefined") return
  try {
    const all = readAssignments()
    if (all[key] === variantId) return
    all[key] = variantId
    const value = encodeURIComponent(JSON.stringify(all))
    document.cookie = `${COOKIE}=${value};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
  } catch {
    // best-effort — bucketing still works deterministically without persistence
  }
}

// Resolve once per key per page load so useSyncExternalStore gets a referentially-stable
// snapshot (React errors if getSnapshot returns a fresh object each call).
const resolved = new Map<string, Variant>()

// Deterministically and stably assign the current visitor to one of `variants`. The same
// (visitorId, experimentKey) pair always yields the same variant. Returns the control
// (variants[0]) on the server, where there is no visitor id. variants[0] is the control.
export function getVariant<V extends Variant>(
  experimentKey: string,
  variants: readonly V[]
): V {
  const control = variants[0]
  if (typeof window === "undefined" || variants.length === 0) return control

  const cached = resolved.get(experimentKey)
  if (cached) return cached as V

  // A cookie assignment wins (keeps a visitor pinned even if variant order changes)…
  const stored = readAssignments()[experimentKey]
  let chosen = (stored && variants.find((v) => v.id === stored)) || undefined

  // …otherwise hash the visitor id into a bucket and persist it.
  if (!chosen) {
    const idx = hashString(`${getVisitorId()}:${experimentKey}`) % variants.length
    chosen = variants[idx]
    writeAssignment(experimentKey, chosen.id)
  }

  resolved.set(experimentKey, chosen)
  return chosen
}
