import { Metadata } from "next"
import ProblemSolver from "@modules/tools/components/problem-solver"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Pool Problem Solver — Green, Cloudy, Stains & Algae Fixes | Aquora",
  description:
    "Pool gone green, cloudy or stained? Tap your problem and get a clear, step-by-step fix from Aquora's pool specialists — plus the exact products to put it right.",
  openGraph: {
    title: "Pool Problem Solver | Aquora",
    description: "Tap your pool problem, get the fix and the products — in under a minute.",
    type: "website",
  },
}

export default function PoolProblemSolverPage() {
  return (
    <div className="content-container py-14 small:py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Free troubleshooting
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.6rem]">
          What&apos;s wrong with your pool?
        </h1>
        <p className="mt-3 text-aquora-muted">
          Tap the problem that matches yours for a clear, step-by-step fix from our specialists — and the exact products
          to put it right.
        </p>
      </div>

      <ProblemSolver />

      <div className="mx-auto mt-14 max-w-2xl rounded-[1.4rem] border border-black/[0.06] bg-aquora-surface/50 px-6 py-6 text-center">
        <p className="text-sm font-semibold text-aquora-ink">Know your readings already?</p>
        <p className="mt-1 text-sm text-aquora-muted">
          The{" "}
          <LocalizedClientLink href="/pool-dosing-calculator" className="font-medium text-aquora-primary hover:underline">
            dosing calculator
          </LocalizedClientLink>{" "}
          gives exact chemical amounts for your pool volume.
        </p>
      </div>
    </div>
  )
}
