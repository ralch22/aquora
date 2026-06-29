"use client"

import { useEffect } from "react"
import { useSyncExternalStore } from "react"
import { trackExperiment } from "@lib/analytics"
import { getVariant, type Experiment, type Variant } from "@lib/aquora/experiments"

// React binding for the A/B harness. Reads the visitor's deterministic variant and reports
// the impression to GA4 exactly once per page load.
//
// HYDRATION-SAFETY (deferred-Suspense-safe by construction — no Suspense at all):
//   The visitor id lives in localStorage, so the server cannot know the variant. We bridge
//   that with useSyncExternalStore: the server snapshot (and therefore the first client
//   render during hydration) is ALWAYS the control, so server and client markup match — no
//   hydration mismatch. React then re-renders with the real client snapshot. A returning
//   visitor bucketed off-control sees one inline re-render to their variant (no Suspense,
//   never hidden). Disable the experiment (enabled:false) and this collapses to the control
//   with zero events emitted.

const EMPTY = () => () => {}

const reported = new Set<string>()

export function useExperiment<V extends Variant>(experiment: Experiment<V>): V {
  const control = experiment.variants[0]

  const variant = useSyncExternalStore<V>(
    EMPTY, // assignment is immutable for the life of the page — nothing to subscribe to
    () => (experiment.enabled ? getVariant(experiment.key, experiment.variants) : control),
    () => control // server + first hydration render: control, so markup is stable
  )

  useEffect(() => {
    if (!experiment.enabled || typeof window === "undefined") return
    const tag = `${experiment.key}:${variant.id}`
    if (reported.has(tag)) return
    reported.add(tag)
    trackExperiment(experiment.key, variant.id)
  }, [experiment.enabled, experiment.key, variant])

  return variant
}

// ── Wired example ──────────────────────────────────────────────────────────────────────
// One real experiment, proving the loop end-to-end on the highest-value CTA in the funnel
// (the PDP add-to-cart button). Both labels are honest — no fabricated urgency/scarcity.
// Flip `enabled` to false to retire it: the control label renders and no events fire.
export const ADD_TO_CART_CTA = {
  key: "add_to_cart_cta",
  enabled: true,
  variants: [
    { id: "control", label: "Add to cart" },
    { id: "to_bag", label: "Add to bag" },
  ],
} as const satisfies Experiment<{ id: string; label: string }>
