// Derive structured spec chips from a product title. Our catalogue titles are rich
// (e.g. "… 15.3 m3/h pump … 0.95HP", "Pentair Max-E-Pro XF pool pump, 3.73 kW, 5 HP")
// so we can surface key specifications without a separate attributes feed.
export type Spec = { label: string; value: string }

const norm = (n: string) => n.replace(",", ".").replace(/\.0+$/, "")

export function parseSpecs(title: string): Spec[] {
  const t = title || ""
  const out: Spec[] = []
  const push = (label: string, re: RegExp, fmt: (m: RegExpMatchArray) => string) => {
    const m = t.match(re)
    if (m) out.push({ label, value: fmt(m) })
  }

  push("Flow rate", /(\d+[.,]?\d*)\s*m3\s*\/?\s*h/i, (m) => `${norm(m[1])} m³/h`)
  push("Power", /(\d+[.,]?\d*)\s*kW\b/i, (m) => `${norm(m[1])} kW`)
  push("Motor", /(\d+[.,]?\d*)\s*HP\b/i, (m) => `${norm(m[1])} HP`)
  push("Pressure", /(\d+[.,]?\d*)\s*bar\b/i, (m) => `${norm(m[1])} bar`)
  push("Dosing", /(\d+[.,]?\d*)\s*l\s*\/?\s*h\b/i, (m) => `${norm(m[1])} l/h`)
  push("Volume", /(\d+[.,]?\d*)\s*m3\b(?!\s*\/)/i, (m) => `${norm(m[1])} m³`)
  push("Connection", /(\d+)\s*mm\b/i, (m) => `${m[1]} mm`)
  push("Voltage", /\b(\d{3})\s*V\b/i, (m) => `${m[1]} V`)

  // De-duplicate by label, keep first match, cap at 5 chips.
  const seen = new Set<string>()
  return out.filter((s) => (seen.has(s.label) ? false : (seen.add(s.label), true))).slice(0, 5)
}
