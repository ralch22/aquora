import { Metadata } from "next"
import SizingCalculator from "@modules/tools/components/sizing-calculator"

export const metadata: Metadata = {
  title: "Pool Sizing Calculator — Pump, Filter & Heater Guide | Aquora",
  description:
    "Work out your pool volume and the right pump flow rate, filter size, heater and chlorinator for your pool. A free guide from Aquora's pool equipment specialists in the UAE.",
  openGraph: {
    title: "Pool Sizing Calculator | Aquora",
    description:
      "Enter your pool dimensions to size the right pump, filter, heater and chlorinator — instantly.",
    type: "website",
  },
}

export default function PoolSizingGuidePage() {
  return (
    <div className="content-container py-14 small:py-20">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Free tool
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-[2.6rem]">
          Pool sizing calculator
        </h1>
        <p className="mt-3 text-aquora-muted">
          Enter your pool&apos;s dimensions and we&apos;ll estimate its volume and the right pump flow rate,
          filter, heater and chlorinator size — so you buy equipment that&apos;s matched to your pool, not guesswork.
        </p>
      </div>

      <SizingCalculator />

      {/* Educational notes — original, SEO-friendly */}
      <div className="mx-auto mt-16 max-w-3xl space-y-8">
        <div>
          <h2 className="font-heading text-xl font-bold text-aquora-ink">How pool equipment is sized</h2>
          <p className="mt-2 text-sm leading-relaxed text-aquora-muted">
            Most pool equipment is sized from one number: your pool&apos;s water volume. Volume is the surface area
            multiplied by the average depth. From there, the circulation pump is chosen so the entire pool passes
            through the filter within a target &ldquo;turnover&rdquo; time — commonly six hours for a residential pool,
            and as little as four for heavily used or warm-climate pools where water clarity is harder to hold.
          </p>
        </div>
        <div className="grid gap-6 small:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-aquora-ink">Pump &amp; filter</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-aquora-muted">
              The pump&apos;s flow rate (m³/h) should match or slightly exceed your turnover requirement, and the
              filter must be rated for at least that flow so it never becomes the bottleneck. An oversized pump on an
              undersized filter wastes energy and shortens filter life.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-aquora-ink">Heating &amp; sanitisation</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-aquora-muted">
              Heat-pump sizing depends on volume but also on your target temperature, ambient conditions and whether
              you use a cover, so treat the kW figure as a starting point. Salt chlorinators are sized so their
              chlorine output comfortably meets the demand of your water volume in local conditions.
            </p>
          </div>
        </div>
        <p className="rounded-[1.2rem] border border-black/[0.06] bg-aquora-surface/60 px-5 py-4 text-xs leading-relaxed text-aquora-muted">
          These figures are a guide to help you shortlist equipment. Real installations vary with plumbing runs,
          elevation, features (spas, water blades, in-floor cleaning) and usage. For a precise specification,{" "}
          <span className="font-medium text-aquora-ink">talk to our team</span> or ask Aqua, our AI advisor.
        </p>
      </div>
    </div>
  )
}
