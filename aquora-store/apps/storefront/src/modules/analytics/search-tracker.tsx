"use client"

import { useEffect } from "react"
import { trackRetailEvent } from "@lib/aquora/retail-track"

// Emits a Google Retail "search" user event (Phase 2) so the recommendation + search models
// learn from what shoppers look for. Fires once per query. Renders nothing.
export default function SearchTracker({ query }: { query: string }) {
  useEffect(() => {
    if (query) trackRetailEvent("search", { searchQuery: query })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
  return null
}
