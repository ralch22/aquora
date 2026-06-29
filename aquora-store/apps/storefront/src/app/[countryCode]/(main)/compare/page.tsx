import { Metadata } from "next"

import CompareView from "@modules/compare/templates/compare-view"

export const metadata: Metadata = {
  title: "Compare products — Aquora",
  description:
    "Compare pool, spa, pond and fountain equipment side by side — price, brand and full specifications aligned to help you choose.",
  robots: { index: false, follow: true },
}

export default function ComparePage() {
  return <CompareView />
}
