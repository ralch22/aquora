import { Metadata } from "next"
import DosingCalculator from "@modules/tools/components/dosing-calculator"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Pool Chemical Dosing Calculator — Free | Aquora",
  description:
    "Enter your pool volume and water test results to get the exact chemical doses to balance your pool — chlorine, pH, alkalinity, calcium and stabiliser — plus the products to fix it. Free, no sign-up.",
  openGraph: {
    title: "Pool Chemical Dosing Calculator | Aquora",
    description: "Test results in, exact doses out. Balance your pool water in seconds.",
    type: "website",
  },
}

export default function PoolDosingCalculatorPage() {
  return (
    <div className="content-container py-14 small:py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Free tool · no sign-up
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.6rem]">
          Pool chemical dosing calculator
        </h1>
        <p className="mt-3 text-aquora-muted">
          Enter your pool volume and your latest water test, and we&apos;ll tell you exactly how much of each chemical
          to add to balance it — and where to get it. No guesswork.
        </p>
      </div>

      <DosingCalculator />

      <div className="mx-auto mt-16 max-w-3xl space-y-8">
        <div>
          <h2 className="font-heading text-xl font-bold text-aquora-ink">Why balanced water matters</h2>
          <p className="mt-2 text-sm leading-relaxed text-aquora-muted">
            Balanced water keeps your pool clear and safe, protects the surface and equipment, and lets your sanitiser
            work efficiently. The five readings that matter most are free chlorine, pH, total alkalinity, calcium
            hardness and stabiliser (cyanuric acid). Test 2–3 times a week — more in peak summer — and adjust one
            reading at a time, starting with alkalinity and pH, then chlorine.
          </p>
        </div>
        <div className="grid gap-6 small:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-aquora-ink">Order of adjustment</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-aquora-muted">
              Balance alkalinity first (it buffers pH), then pH, then sanitiser. Add calcium and stabiliser as needed.
              Re-test a few hours after each addition before adding anything else.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-aquora-ink">UAE pools run hot</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-aquora-muted">
              Intense sun burns off chlorine quickly, so stabiliser (CYA) is essential here, and evaporation concentrates
              calcium — keep an eye on both. A salt or dosing system can automate day-to-day balancing.
            </p>
          </div>
        </div>
        <p className="rounded-[1.2rem] border border-black/[0.06] bg-aquora-surface/60 px-5 py-4 text-xs leading-relaxed text-aquora-muted">
          Doses shown are guide amounts to bring each reading toward the middle of its ideal range. Always follow the
          product label, add one chemical at a time with the pump running, re-test before adding more, and never mix
          chemicals. Not sure?{" "}
          <LocalizedClientLink href="/pool-problem-solver" className="font-medium text-aquora-ink hover:underline">
            Try the problem solver
          </LocalizedClientLink>{" "}
          or ask our team.
        </p>
      </div>
    </div>
  )
}
