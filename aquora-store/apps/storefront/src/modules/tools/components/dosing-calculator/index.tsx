"use client"

import { useMemo, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Industry-standard target ranges + dose rates (per 1 m³ = 1000 L). Doses move the reading toward
// the MIDDLE of the ideal range. These are guide figures — the UI makes clear to follow the label,
// dose in stages and re-test. Rates are conventional pool-chemistry approximations.
type Param = {
  key: string
  label: string
  unit: string
  min: number
  max: number
  placeholder: string
}

const PARAMS: Param[] = [
  { key: "fc", label: "Free chlorine", unit: "ppm", min: 1, max: 3, placeholder: "e.g. 1.0" },
  { key: "ph", label: "pH", unit: "", min: 7.2, max: 7.6, placeholder: "e.g. 7.8" },
  { key: "ta", label: "Total alkalinity", unit: "ppm", min: 80, max: 120, placeholder: "e.g. 60" },
  { key: "ch", label: "Calcium hardness", unit: "ppm", min: 200, max: 400, placeholder: "e.g. 150" },
  { key: "cya", label: "Stabiliser (CYA)", unit: "ppm", min: 30, max: 50, placeholder: "e.g. 10" },
]

type Rec = {
  title: string
  dose: string
  note: string
  href: string
  cta: string
  tone: "add" | "reduce" | "info"
}

// grams → friendly "X g" / "X.X kg"
function g(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toLocaleString("en-AE", { maximumFractionDigits: 2 })} kg`
  return `${Math.round(grams).toLocaleString("en-AE")} g`
}

const SHOP = {
  chlorine: "/search?cat=Pool%20chlorine",
  ph: "/search?cat=Pool%20pH%20regulators",
  alkalinity: "/search?q=alkalinity%20buffer",
  calcium: "/search?q=calcium%20hardness%20increaser",
  stabiliser: "/search?q=stabiliser%20cyanuric%20acid",
  algaecide: "/search?cat=Pool%20algaecide",
  testers: "/search?cat=Pool%20testers",
}

export default function DosingCalculator() {
  const [volume, setVolume] = useState("50")
  const [vals, setVals] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: v }))

  const recs = useMemo<Rec[]>(() => {
    const V = Math.max(0, parseFloat(volume) || 0) // m³
    if (V <= 0) return []
    const out: Rec[] = []
    const num = (k: string) => (vals[k] === "" || vals[k] == null ? null : parseFloat(vals[k]))

    // --- Free chlorine ---
    const fc = num("fc")
    if (fc != null && !isNaN(fc)) {
      const mid = 2
      if (fc < 1) {
        const grams = 1.5 * V * (mid - fc) // ~1.5 g/m³ per ppm (65% granular)
        out.push({
          title: "Raise free chlorine",
          dose: `Add ~${g(grams)} of granular chlorine (65%)`,
          note: `Brings chlorine up toward 2 ppm. Pre-dissolve, broadcast with the pump running, re-test after a few hours.`,
          href: SHOP.chlorine, cta: "Shop chlorine", tone: "add",
        })
      } else if (fc > 3) {
        out.push({
          title: "Chlorine is high",
          dose: "Hold off adding chlorine",
          note: "Let levels fall naturally (sunlight) or partially dilute with fresh water. Avoid swimming above ~5 ppm.",
          href: SHOP.testers, cta: "Shop test kits", tone: "info",
        })
      }
    }

    // --- pH (TA-dependent, so conservative + stage) ---
    const ph = num("ph")
    if (ph != null && !isNaN(ph)) {
      if (ph > 7.6) {
        const grams = 12 * V * ((ph - 7.4) / 0.2) // ~12 g/m³ per 0.2 pH (dry acid, approx)
        out.push({
          title: "Lower pH",
          dose: `Add ~${g(grams)} of pH reducer (dry acid)`,
          note: "pH is buffered by alkalinity — add about half first, run the pump, re-test in a few hours, then top up.",
          href: SHOP.ph, cta: "Shop pH reducers", tone: "reduce",
        })
      } else if (ph < 7.2) {
        const grams = 8 * V * ((7.4 - ph) / 0.2) // soda ash approx
        out.push({
          title: "Raise pH",
          dose: `Add ~${g(grams)} of pH increaser (soda ash)`,
          note: "Add in stages with the pump running and re-test before adding more.",
          href: SHOP.ph, cta: "Shop pH increasers", tone: "add",
        })
      }
    }

    // --- Total alkalinity ---
    const ta = num("ta")
    if (ta != null && !isNaN(ta)) {
      if (ta < 80) {
        const grams = 17 * V * ((100 - ta) / 10) // ~17 g/m³ per 10 ppm (sodium bicarb)
        out.push({
          title: "Raise total alkalinity",
          dose: `Add ~${g(grams)} of alkalinity buffer (sodium bicarbonate)`,
          note: "Buffers pH and prevents swings. Broadcast over the surface with the pump running; re-test after several hours.",
          href: SHOP.alkalinity, cta: "Shop alkalinity buffer", tone: "add",
        })
      } else if (ta > 120) {
        out.push({
          title: "Lower total alkalinity",
          dose: "Add pH reducer (dry acid) in stages",
          note: "Lowering alkalinity also lowers pH — go slowly, aerate, and re-test. Our team can guide the exact amount.",
          href: SHOP.ph, cta: "Shop pH reducers", tone: "reduce",
        })
      }
    }

    // --- Calcium hardness ---
    const ch = num("ch")
    if (ch != null && !isNaN(ch) && ch < 200) {
      const grams = 12 * V * ((300 - ch) / 10) // ~12 g/m³ per 10 ppm (calcium chloride)
      out.push({
        title: "Raise calcium hardness",
        dose: `Add ~${g(grams)} of calcium hardness increaser`,
        note: "Protects surfaces and equipment from corrosive soft water. Dissolve in a bucket first; add slowly.",
        href: SHOP.calcium, cta: "Shop calcium increaser", tone: "add",
      })
    }

    // --- Stabiliser / CYA ---
    const cya = num("cya")
    if (cya != null && !isNaN(cya) && cya < 30) {
      const grams = 10 * V * ((40 - cya) / 10) // ~10 g/m³ per 10 ppm (cyanuric acid)
      out.push({
        title: "Raise stabiliser (CYA)",
        dose: `Add ~${g(grams)} of stabiliser (cyanuric acid)`,
        note: "Protects chlorine from UV in the UAE sun. Adds slowly over a few days via the skimmer — don't over-dose.",
        href: SHOP.stabiliser, cta: "Shop stabiliser", tone: "add",
      })
    }

    return out
  }, [volume, vals])

  const anyInput = Object.values(vals).some((v) => v !== "" && v != null)
  const allBalanced = anyInput && recs.length === 0 && (parseFloat(volume) || 0) > 0

  const toneClasses: Record<Rec["tone"], string> = {
    add: "border-aquora-primary/20 bg-aquora-primary/[0.04]",
    reduce: "border-aquora-accent/30 bg-aquora-accent/[0.06]",
    info: "border-black/[0.08] bg-aquora-surface/60",
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
      {/* Inputs */}
      <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_24px_60px_-34px_rgba(11,31,36,0.3)] small:p-8">
        <p className="font-heading text-lg font-bold text-aquora-ink">Your readings</p>
        <p className="mt-1 text-xs text-aquora-muted">Fill in what you know — leave the rest blank.</p>

        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Pool volume</span>
          <div className="flex items-center rounded-xl border border-black/10 bg-white transition focus-within:border-aquora-primary focus-within:ring-2 focus-within:ring-aquora-primary/20">
            <input type="number" inputMode="decimal" min={0} step={1} value={volume} onChange={(e) => setVolume(e.target.value)}
              className="w-full bg-transparent px-3.5 py-2.5 text-sm outline-none" />
            <span className="px-3 text-xs font-medium text-aquora-muted">m³</span>
          </div>
          <LocalizedClientLink href="/pool-sizing-guide" className="text-[11px] font-medium text-aquora-primary hover:underline">
            Don&apos;t know your volume? Work it out →
          </LocalizedClientLink>
        </label>

        <div className="mt-5 space-y-3">
          {PARAMS.map((p) => {
            const v = vals[p.key]
            const n = v === "" || v == null ? null : parseFloat(v)
            const inRange = n != null && !isNaN(n) && n >= p.min && n <= p.max
            const outRange = n != null && !isNaN(n) && (n < p.min || n > p.max)
            return (
              <label key={p.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-aquora-ink">{p.label}</span>
                <div className={`flex flex-1 items-center rounded-xl border bg-white transition focus-within:ring-2 focus-within:ring-aquora-primary/20 ${outRange ? "border-aquora-accent" : inRange ? "border-aquora-primary/40" : "border-black/10"}`}>
                  <input type="number" inputMode="decimal" min={0} step={p.key === "ph" ? 0.1 : 1}
                    placeholder={p.placeholder} value={v ?? ""} onChange={(e) => set(p.key, e.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-sm outline-none" />
                  {p.unit && <span className="px-2.5 text-[11px] font-medium text-aquora-muted">{p.unit}</span>}
                </div>
                <span className="w-20 shrink-0 text-right text-[11px] text-aquora-muted">{p.min}–{p.max}{p.unit ? ` ${p.unit}` : ""}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Results */}
      <div>
        {!anyInput && (
          <div className="rounded-[1.75rem] border border-dashed border-black/10 bg-aquora-surface/40 px-6 py-12 text-center">
            <p className="font-heading text-lg font-bold text-aquora-ink">Enter your test results</p>
            <p className="mt-2 text-sm text-aquora-muted">We&apos;ll tell you exactly what to add to balance your water — and where to get it.</p>
          </div>
        )}

        {allBalanced && (
          <div className="rounded-[1.75rem] border border-aquora-primary/20 bg-aquora-primary/[0.05] px-6 py-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-aquora-primary text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.5l5 5 11-11" /></svg>
            </div>
            <p className="mt-4 font-heading text-xl font-bold text-aquora-ink">Your water looks balanced</p>
            <p className="mt-2 text-sm text-aquora-muted">Every reading is within the ideal range. Keep testing 2–3 times a week to stay there.</p>
          </div>
        )}

        {recs.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-aquora-ink">Recommended for a {volume} m³ pool:</p>
            {recs.map((r, i) => (
              <div key={i} className={`flex flex-col gap-2 rounded-[1.4rem] border p-5 small:flex-row small:items-center small:justify-between ${toneClasses[r.tone]}`}>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-aquora-ink">{r.title}</p>
                  <p className="mt-0.5 font-heading text-lg font-bold text-aquora-primary">{r.dose}</p>
                  <p className="mt-1 text-xs leading-relaxed text-aquora-muted">{r.note}</p>
                </div>
                <LocalizedClientLink href={r.href} className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-aquora-ink px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]">
                  {r.cta}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
                </LocalizedClientLink>
              </div>
            ))}
          </div>
        )}

        {anyInput && (
          <div className="mt-6 flex flex-col gap-3 rounded-[1.4rem] border border-black/[0.06] bg-aquora-surface/60 p-5 text-xs leading-relaxed text-aquora-muted small:flex-row small:items-center small:justify-between">
            <p>
              <span className="font-semibold text-aquora-ink">Dose safely.</span> These are guide amounts — always follow the product label, add one chemical at a time with the pump running, re-test before adding more, and never mix chemicals together.
            </p>
            <LocalizedClientLink href="/contact" className="inline-flex shrink-0 items-center justify-center rounded-full bg-aquora-ink px-4 py-2 text-xs font-semibold text-white">
              Ask our team
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}
