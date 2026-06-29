"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  type Assignments,
  type ExperimentKey,
  EXPERIMENTS,
  getAllAssignments,
} from "@lib/aquora/experiments"
import { getVisitorId } from "@lib/aquora/retail-track"
import { trackExperimentImpression } from "@lib/analytics"

type Ctx = {
  assignments: Assignments
  fire: (key: ExperimentKey) => void
}

const ExperimentsContext = createContext<Ctx>({ assignments: {}, fire: () => {} })

// Wraps the app with the server-computed variant assignments. The initial render uses the
// server values verbatim (matching SSR → no hydration mismatch / flicker). On mount, if the
// server had no visitor id (brand-new visitor, no aq_vid cookie yet), it establishes one and
// recomputes the assignments client-side so the visitor is bucketed from then on.
export default function ExperimentsProvider({
  assignments: serverAssignments,
  hasVisitorId,
  children,
}: {
  assignments: Assignments
  hasVisitorId: boolean
  children: React.ReactNode
}) {
  const [assignments, setAssignments] = useState<Assignments>(serverAssignments)

  useEffect(() => {
    // Always ensure a stable visitor id exists (sets the aq_vid cookie + localStorage).
    const vid = getVisitorId()
    // Only recompute when the server couldn't bucket — otherwise keep the SSR-stable value.
    if (!hasVisitorId && vid && vid !== "anon") {
      setAssignments(getAllAssignments(vid))
    }
  }, [hasVisitorId])

  // Exposure-based impressions: an event fires (once) only when a component actually reads
  // an experiment via useVariant, so we never log impressions for experiments not rendered.
  const fired = useRef<Set<string>>(new Set())
  const fire = useCallback(
    (key: ExperimentKey) => {
      if (fired.current.has(key)) return
      const variant = assignments[key]
      if (variant == null) return
      fired.current.add(key)
      trackExperimentImpression(key, variant)
    },
    [assignments]
  )

  const value = useMemo<Ctx>(() => ({ assignments, fire }), [assignments, fire])

  return <ExperimentsContext.Provider value={value}>{children}</ExperimentsContext.Provider>
}

// Read the active variant for an experiment and record an impression. Returns the control
// ("control" — the first registered variant) when the experiment is absent/disabled, so
// removing an experiment leaves consumers rendering the control with zero residual events.
export function useVariant(key: ExperimentKey): string {
  const { assignments, fire } = useContext(ExperimentsContext)
  const registered = key in EXPERIMENTS
  useEffect(() => {
    if (registered) fire(key)
  }, [key, registered, fire])
  return assignments[key] ?? "control"
}
