// Lightweight, dependency-free A/B test harness. Buckets a visitor deterministically
// (hash of the shared aq_vid visitor id + experiment key → variant) so the SAME visitor
// always gets the SAME variant across reloads. Pure logic only — no React, no next/headers,
// no "use client" — so it is safely importable from both server and client code.
//
// Assignment is deliberately SSR-stable: the server reads the aq_vid cookie (see the
// (main) layout) and computes the assignment, the client reads the same cookie and
// computes the same value, so variants render inline with no hydration flicker and no
// streamed/deferred Suspense (which never resolves in this deployment).

// Cookie/localStorage key for the visitor id — shared with retail-track.ts so experiments
// bucket on the same id used for Google Retail personalization.
export const VISITOR_COOKIE = "aq_vid"

// Experiment registry. The FIRST variant is always the control. Removing an experiment
// from this map disables it everywhere: no assignment is produced, useVariant() falls back
// to the control, and zero impression events fire.
export const EXPERIMENTS = {
  // Add-to-cart CTA copy on the product page (control wording vs. a more concise label).
  pdp_add_to_cart_cta: ["control", "concise"],
} as const

export type ExperimentKey = keyof typeof EXPERIMENTS
export type Assignments = Partial<Record<ExperimentKey, string>>

// FNV-1a 32-bit — small, fast, well-distributed string hash. Math.imul keeps it 32-bit.
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Deterministically map (visitorId, key) → one of variants. Falls back to the control
// (first variant) when the visitor id is unknown (e.g. a brand-new visitor during SSR),
// so an unbucketed render is always the control rather than a random/empty value.
export function assignVariant(
  visitorId: string | null | undefined,
  key: string,
  variants: readonly string[]
): string {
  if (!variants || variants.length === 0) return "control"
  if (variants.length === 1) return variants[0]
  if (!visitorId || visitorId === "anon") return variants[0]
  return variants[hashString(`${key}:${visitorId}`) % variants.length]
}

// Compute the variant for every registered experiment for a given visitor id.
export function getAllAssignments(visitorId: string | null | undefined): Assignments {
  const out: Assignments = {}
  for (const key of Object.keys(EXPERIMENTS) as ExperimentKey[]) {
    out[key] = assignVariant(visitorId, key, EXPERIMENTS[key])
  }
  return out
}
