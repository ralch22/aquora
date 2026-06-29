"use client"

import { useEffect } from "react"
import { trackRetailEvent } from "@lib/aquora/retail-track"
import { trackSearch } from "@lib/analytics"

// Emits a Google Retail "search" user event (Phase 2) so the recommendation + search models
// learn from what shoppers look for, AND a GA4 "search" event (with search_term) so search
// usage and zero-result queries are visible in GA4. These are distinct channels — no
// double-counting. Fires once per query. Renders nothing.
export default function SearchTracker({ query }: { query: string }) {
  useEffect(() => {
    if (query) {
      trackRetailEvent("search", { searchQuery: query })
      trackSearch(query)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])
  return null
}
