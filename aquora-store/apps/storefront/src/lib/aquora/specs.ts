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

// Prefer the real, factual metadata.specs (scraped) for the chip row; fall back to
// title-parsing when a product has no specs. Names carry units (e.g. "Power, kW",
// "Recommended flow rate m3/h") which we fold into the value for a clean chip.
type RawSpec = { name: string; value: string }
const CHIP_PRIORITY: { test: RegExp; label: string }[] = [
  { test: /^power\b(?!\s*consumption)/i, label: "Power" },
  { test: /flow/i, label: "Flow rate" },
  { test: /pool volume/i, label: "Pool volume" },
  { test: /voltage/i, label: "Voltage" },
  { test: /phase/i, label: "Phase" },
  { test: /power consumption/i, label: "Power use" },
  { test: /pressure/i, label: "Pressure" },
  { test: /capacity/i, label: "Capacity" },
  { test: /(filter|heat pump)\s*type/i, label: "Type" },
]

function chipValue(spec: RawSpec): string | null {
  let value = (spec.value || "").trim()
  if (!value) return null
  let unit = ""
  const comma = spec.name.match(/,\s*([^,]+)$/) // ", kW" / ", mm"
  if (comma) unit = comma[1].trim()
  if (!unit) {
    const tail = spec.name.match(/\b(m3\s*\/\s*h|m3|kW|HP|bar|mm|l\s*\/\s*h)\b/i)
    if (tail) unit = tail[1]
  }
  unit = unit.replace(/m3\s*\/\s*h/i, "m³/h").replace(/m3/i, "m³")
  if (unit && !new RegExp(unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(value)) {
    value = `${value} ${unit}`
  }
  return value.length > 24 ? null : value // skip long values (e.g. dimensions)
}

export function topSpecChips(specs: RawSpec[] | undefined, title: string, max = 4): Spec[] {
  if (specs?.length) {
    const out: Spec[] = []
    const used = new Set<string>()
    for (const pr of CHIP_PRIORITY) {
      const m = specs.find((s) => pr.test.test(s.name) && !used.has(s.name))
      if (!m) continue
      const value = chipValue(m)
      if (!value) continue
      used.add(m.name)
      out.push({ label: pr.label, value })
      if (out.length >= max) break
    }
    if (out.length >= 2) return out
  }
  return parseSpecs(title).slice(0, max)
}
