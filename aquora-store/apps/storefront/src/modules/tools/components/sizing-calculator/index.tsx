"use client"

import { useMemo, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Shape = "rectangular" | "oval" | "freeform"
type Unit = "m" | "ft"

const FT = 0.3048

function Field({
  label,
  value,
  onChange,
  unit,
  step = 0.1,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  unit: string
  step?: number
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">{label}</span>
      <div className="flex items-center rounded-xl border border-black/10 bg-white transition focus-within:border-aquora-primary focus-within:ring-2 focus-within:ring-aquora-primary/20">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3.5 py-2.5 text-sm outline-none"
        />
        <span className="px-3 text-xs font-medium text-aquora-muted">{unit}</span>
      </div>
    </label>
  )
}

function ResultCard({
  eyebrow,
  value,
  sub,
  href,
  cta,
}: {
  eyebrow: string
  value: string
  sub: string
  href: string
  cta: string
}) {
  return (
    <div className="flex flex-col rounded-[1.4rem] border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgba(11,31,36,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:border-aquora-primary/25 hover:shadow-[0_18px_40px_-22px_rgba(14,110,115,0.28)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aquora-muted">{eyebrow}</p>
      <p className="mt-2 font-heading text-2xl font-bold text-aquora-ink">{value}</p>
      <p className="mt-1 flex-1 text-sm text-aquora-muted">{sub}</p>
      <LocalizedClientLink
        href={href}
        className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-aquora-primary transition-colors hover:text-aquora-secondary"
      >
        {cta}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
          <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
        </svg>
      </LocalizedClientLink>
    </div>
  )
}

export default function SizingCalculator() {
  const [unit, setUnit] = useState<Unit>("m")
  const [shape, setShape] = useState<Shape>("rectangular")
  const [length, setLength] = useState("8")
  const [width, setWidth] = useState("4")
  const [shallow, setShallow] = useState("1.2")
  const [deep, setDeep] = useState("2")
  const [turnover, setTurnover] = useState(6)

  const calc = useMemo(() => {
    const k = unit === "ft" ? FT : 1
    const L = Math.max(0, parseFloat(length) || 0) * k
    const W = Math.max(0, parseFloat(width) || 0) * k
    const ds = Math.max(0, parseFloat(shallow) || 0) * k
    const dd = Math.max(0, parseFloat(deep) || 0) * k
    const avgDepth = (ds + dd) / 2
    let area = L * W
    if (shape === "oval") area = Math.PI * (L / 2) * (W / 2)
    if (shape === "freeform") area = L * W * 0.85
    const volume = area * avgDepth // m³
    const liters = volume * 1000
    const usGal = liters * 0.264172
    const flow = volume > 0 ? volume / turnover : 0 // m³/h
    const hpLow = volume * 0.15
    const hpHigh = volume * 0.25
    const saltGph = volume * 0.2
    return { volume, liters, usGal, flow, hpLow, hpHigh, saltGph }
  }, [unit, shape, length, width, shallow, deep, turnover])

  const valid = calc.volume > 0
  const r1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-AE", { maximumFractionDigits: 1 })
  const r0 = (n: number) => Math.ceil(n).toLocaleString("en-AE")

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      {/* Inputs */}
      <div className="rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_24px_60px_-34px_rgba(11,31,36,0.3)] small:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-heading text-lg font-bold text-aquora-ink">Your pool</p>
          <div className="inline-flex rounded-full border border-black/10 p-0.5 text-xs font-semibold">
            {(["m", "ft"] as Unit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`rounded-full px-3 py-1 transition ${unit === u ? "bg-aquora-primary text-white" : "text-aquora-muted hover:text-aquora-ink"}`}
              >
                {u === "m" ? "Metres" : "Feet"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Shape</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([["rectangular", "Rectangular"], ["oval", "Oval / round"], ["freeform", "Freeform"]] as [Shape, string][]).map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => setShape(s)}
                className={`rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                  shape === s ? "border-aquora-primary bg-aquora-primary/5 text-aquora-primary" : "border-black/10 text-aquora-ink/70 hover:border-black/20"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field label={shape === "oval" ? "Max length" : "Length"} value={length} onChange={setLength} unit={unit} />
          <Field label={shape === "oval" ? "Max width" : "Width"} value={width} onChange={setWidth} unit={unit} />
          <Field label="Shallow depth" value={shallow} onChange={setShallow} unit={unit} />
          <Field label="Deep depth" value={deep} onChange={setDeep} unit={unit} />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-aquora-muted">Turnover target</span>
            <span className="text-sm font-bold text-aquora-ink">{turnover} h</span>
          </div>
          <input
            type="range"
            min={4}
            max={8}
            step={1}
            value={turnover}
            onChange={(e) => setTurnover(parseInt(e.target.value))}
            className="mt-2 w-full accent-aquora-primary"
          />
          <p className="mt-1 text-[11px] text-aquora-muted">
            How often the whole pool is filtered. 6 h suits most residential pools; 4 h for heavy use or warm climates.
          </p>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="rounded-[1.75rem] border border-aquora-primary/15 bg-gradient-to-br from-aquora-secondary to-aquora-primary p-6 text-white shadow-[0_24px_60px_-30px_rgba(14,110,115,0.5)] small:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent">Estimated pool volume</p>
          <p className="mt-2 font-heading text-4xl font-extrabold small:text-5xl">
            {valid ? r1(calc.volume) : "—"} <span className="text-2xl font-bold">m³</span>
          </p>
          <p className="mt-1 text-sm text-white/70">
            {valid ? `≈ ${r0(calc.liters)} litres · ${r0(calc.usGal)} US gallons` : "Enter your pool dimensions to begin"}
          </p>
        </div>

        <div className="mt-6 grid gap-4 small:grid-cols-2">
          <ResultCard
            eyebrow="Circulation pump"
            value={valid ? `${r1(calc.flow)} m³/h` : "—"}
            sub={`Flow rate for a ${turnover}-hour turnover. Choose a pump rated at or above this.`}
            href="/categories/pool-pumps"
            cta="Shop pumps"
          />
          <ResultCard
            eyebrow="Filter"
            value={valid ? `≥ ${r1(calc.flow)} m³/h` : "—"}
            sub="Match the filter's rated flow to your pump so it isn't the bottleneck."
            href="/categories/pool-filtration-systems"
            cta="Shop filtration"
          />
          <ResultCard
            eyebrow="Heat pump (indicative)"
            value={valid ? `${r1(calc.hpLow)}–${r1(calc.hpHigh)} kW` : "—"}
            sub="Indicative only — real sizing depends on target temperature, climate and whether you use a cover."
            href="/categories/pool-heaters"
            cta="Shop heating"
          />
          <ResultCard
            eyebrow="Salt chlorinator (indicative)"
            value={valid ? `≥ ${r0(calc.saltGph)} g/h` : "—"}
            sub="Chlorine output to comfortably sanitise this volume in UAE conditions."
            href="/categories/water-treatment-equipment"
            cta="Shop sanitisation"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[1.4rem] border border-black/[0.06] bg-aquora-surface/60 p-5 small:flex-row small:items-center small:justify-between">
          <p className="text-sm text-aquora-ink">
            <span className="font-semibold">These are guide figures.</span> For a precise specification, ask our team — or chat with Aqua, our AI advisor.
          </p>
          <LocalizedClientLink
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-aquora-ink px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            Talk to an expert
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
