"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPicks from "@modules/tools/components/product-picks"

type Product = { label: string; href: string }
type Problem = {
  id: string
  emoji: string // rendered as an SVG glyph, not an emoji (brand rule: no emojis)
  title: string
  symptom: string
  cause: string
  steps: string[]
  products: Product[]
}

// SVG glyphs keyed by id (no emojis per brand rules)
const GLYPH: Record<string, React.ReactNode> = {
  green: <path d="M12 3c4 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2-6 6-10z" />,
  cloudy: <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A3.5 3.5 0 0 1 17 18z" />,
  blackspot: <><circle cx="8" cy="9" r="2.4" /><circle cx="15" cy="14" r="3" /></>,
  stain: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11zM9 14c1 1.5 4 1.5 5 0" />,
  smell: <path d="M5 12h14M7 8c2-2 4 2 6 0s4-2 5 0M7 16c2 2 4-2 6 0s4 2 5 0" />,
  hold: <path d="M12 3v6m0 6v6M5 8l3 2M16 14l3 2M5 16l3-2M16 10l3-2" />,
  scale: <path d="M4 18l4-6 3 4 3-6 6 8z" />,
}

const PROBLEMS: Problem[] = [
  {
    id: "green",
    emoji: "",
    title: "Green water / algae",
    symptom: "The water has turned green or cloudy-green.",
    cause: "Algae has bloomed because the sanitiser (chlorine) dropped too low, often after heat, rain or heavy use.",
    steps: [
      "Test and balance pH to 7.2–7.6 first — chlorine works best in range.",
      "Shock the pool with a high dose of chlorine (follow the label for your volume).",
      "Add an algaecide to kill and prevent regrowth.",
      "Run the filter continuously for 24–48 hours; backwash/clean as it loads up.",
      "Vacuum settled debris; if still cloudy, add a clarifier/flocculant and re-filter.",
    ],
    products: [
      { label: "Chlorine & shock", href: "/search?cat=Pool%20chlorine" },
      { label: "Algaecide", href: "/search?cat=Pool%20algaecide" },
      { label: "Clarifier / flocculant", href: "/search?cat=Pool%20flocculant" },
      { label: "Test kits", href: "/search?cat=Pool%20testers" },
    ],
  },
  {
    id: "cloudy",
    emoji: "",
    title: "Cloudy / milky water",
    symptom: "Water is dull or milky but not green.",
    cause: "Usually fine particles the filter can't catch, or chemistry out of balance (high pH/calcium).",
    steps: [
      "Test and balance pH and alkalinity.",
      "Check and clean the filter; run it longer.",
      "Add a clarifier (gels fine particles so the filter catches them) or a flocculant (drops them to vacuum to waste).",
      "Run the filter and re-test the next day.",
    ],
    products: [
      { label: "Clarifier / flocculant", href: "/search?cat=Pool%20flocculant" },
      { label: "Test kits", href: "/search?cat=Pool%20testers" },
      { label: "Filtration", href: "/categories/pool-filtration-systems" },
    ],
  },
  {
    id: "blackspot",
    emoji: "",
    title: "Black spot algae",
    symptom: "Dark spots that won't brush off the surface.",
    cause: "Stubborn black-spot algae rooted into the surface — needs mechanical + chemical attack.",
    steps: [
      "Brush the spots hard with a stiff/steel brush to break the protective layer.",
      "Raise chlorine and apply a black-spot-rated algaecide directly to the spots.",
      "Keep chlorine high and brush daily until the spots fade.",
      "Maintain stabiliser so chlorine holds in the sun.",
    ],
    products: [
      { label: "Algaecide", href: "/search?cat=Pool%20algaecide" },
      { label: "Chlorine & shock", href: "/search?cat=Pool%20chlorine" },
      { label: "Stabiliser", href: "/search?q=stabiliser%20cyanuric%20acid" },
    ],
  },
  {
    id: "stain",
    emoji: "",
    title: "Stains on the surface",
    symptom: "Brown, grey, green or rust-coloured marks on walls/floor.",
    cause: "Metals (iron, copper, manganese) in the water, or organic debris, leaving deposits.",
    steps: [
      "Identify the type — a vitamin-C tablet held on a metal stain that lightens it confirms metals.",
      "Use a stain remover / sequestrant to lift and hold metals in solution.",
      "Balance pH and avoid adding chlorine directly onto fresh stains.",
      "Filter and, for metals, use a sequestrant regularly to prevent return.",
    ],
    products: [
      { label: "Stain remover / sequestrant", href: "/search?q=stain%20remover%20sequestrant" },
      { label: "Water treatment", href: "/categories/water-treatment-equipment" },
      { label: "Test kits", href: "/search?cat=Pool%20testers" },
    ],
  },
  {
    id: "smell",
    emoji: "",
    title: "Strong chlorine smell / irritation",
    symptom: "Sharp 'chlorine' smell, stinging eyes or itchy skin.",
    cause: "Counter-intuitively this usually means too LITTLE free chlorine — used-up chloramines build up, plus pH may be off.",
    steps: [
      "Test free chlorine and pH (aim pH 7.2–7.6).",
      "Shock the pool to break down chloramines (raise chlorine sharply).",
      "Run the filter; let levels return to 1–3 ppm before swimming.",
    ],
    products: [
      { label: "Chlorine & shock", href: "/search?cat=Pool%20chlorine" },
      { label: "pH balancers", href: "/search?cat=Pool%20pH%20regulators" },
      { label: "Test kits", href: "/search?cat=Pool%20testers" },
    ],
  },
  {
    id: "hold",
    emoji: "",
    title: "Chlorine won't hold",
    symptom: "You add chlorine but it's gone within hours.",
    cause: "Low stabiliser (CYA) lets the UAE sun burn off chlorine fast, or there's a hidden algae/organic demand.",
    steps: [
      "Test stabiliser — if below ~30 ppm, raise it (protects chlorine from UV).",
      "If stabiliser is fine, shock to clear a hidden chlorine demand (early algae/organics).",
      "Re-test after 24 hours; chlorine should now hold.",
    ],
    products: [
      { label: "Stabiliser (CYA)", href: "/search?q=stabiliser%20cyanuric%20acid" },
      { label: "Chlorine & shock", href: "/search?cat=Pool%20chlorine" },
      { label: "Test kits", href: "/search?cat=Pool%20testers" },
    ],
  },
  {
    id: "scale",
    emoji: "",
    title: "Scale / calcium build-up",
    symptom: "White crusty deposits on the waterline, fittings or heater.",
    cause: "High pH, alkalinity or calcium hardness causing calcium to precipitate out.",
    steps: [
      "Test pH, alkalinity and calcium hardness.",
      "Lower pH (and alkalinity if high) into range.",
      "Use a scale inhibitor / sequestrant to keep calcium in solution.",
      "Watch heaters and salt cells — scale shortens their life.",
    ],
    products: [
      { label: "pH reducers", href: "/search?cat=Pool%20pH%20regulators" },
      { label: "Scale inhibitor", href: "/search?q=scale%20inhibitor%20sequestrant" },
      { label: "Test kits", href: "/search?cat=Pool%20testers" },
    ],
  },
]

export default function ProblemSolver() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      <div className="grid gap-3 small:grid-cols-2 lg:grid-cols-3">
        {PROBLEMS.map((p) => {
          const active = open === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setOpen(active ? null : p.id)}
              aria-expanded={active}
              className={`flex items-center gap-3 rounded-[1.3rem] border p-4 text-left transition-all duration-300 ${
                active
                  ? "border-aquora-primary bg-aquora-primary/[0.05] shadow-[0_18px_40px_-24px_rgba(14,110,115,0.35)]"
                  : "border-black/[0.06] bg-white hover:-translate-y-0.5 hover:border-aquora-primary/25"
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${active ? "bg-aquora-primary text-white" : "bg-aquora-surface text-aquora-primary"}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {GLYPH[p.id]}
                </svg>
              </span>
              <span className="flex-1 text-sm font-semibold text-aquora-ink">{p.title}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-aquora-muted transition-transform duration-300 ${active ? "rotate-90 text-aquora-primary" : ""}`} aria-hidden>
                <path d="M6 4l4 4-4 4" />
              </svg>
            </button>
          )
        })}
      </div>

      {/* Solution panel */}
      {open && (() => {
        const p = PROBLEMS.find((x) => x.id === open)!
        return (
          <div className="mt-6 rounded-[1.75rem] border border-black/[0.06] bg-white p-6 shadow-[0_24px_60px_-34px_rgba(11,31,36,0.3)] small:p-8">
            <h3 className="font-heading text-xl font-bold text-aquora-ink">{p.title}</h3>
            <p className="mt-1 text-sm text-aquora-muted">{p.symptom}</p>
            <div className="mt-4 rounded-[1.1rem] bg-aquora-surface/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aquora-primary">Likely cause</p>
              <p className="mt-1 text-sm text-aquora-ink/90">{p.cause}</p>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aquora-muted">How to fix it</p>
              <ol className="mt-3 space-y-2.5">
                {p.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-aquora-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-aquora-primary/10 text-xs font-bold text-aquora-primary">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aquora-muted">What you&apos;ll need</p>
              {p.products[0] && (
                <div className="mt-3">
                  <ProductPicks source={p.products[0].href} limit={3} cols={3} eyebrow="Top picks" />
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2.5">
                {p.products.map((pr) => (
                  <LocalizedClientLink key={pr.href} href={pr.href}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-aquora-primary/30 bg-aquora-primary/[0.04] px-4 py-2 text-sm font-semibold text-aquora-primary transition hover:bg-aquora-primary hover:text-white">
                    {pr.label}
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" /></svg>
                  </LocalizedClientLink>
                ))}
              </div>
            </div>
            <p className="mt-6 rounded-[1.1rem] border border-black/[0.06] bg-aquora-surface/40 px-4 py-3 text-xs leading-relaxed text-aquora-muted">
              Still stuck? Use our <LocalizedClientLink href="/pool-dosing-calculator" className="font-medium text-aquora-primary hover:underline">dosing calculator</LocalizedClientLink> for exact amounts, or ask Aqua (our AI advisor, bottom-right) or our team. Always follow product labels and add chemicals in stages.
            </p>
          </div>
        )
      })()}
    </div>
  )
}
