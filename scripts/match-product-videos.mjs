#!/usr/bin/env node
// Map products → relevant educational topic videos (verified embeddable YouTube IDs) by their
// scraped category chain + product name. Conservative: only assigns a video where it is genuinely
// relevant (heat-pump video only to heat pumps, etc.); skips spare parts / pipes / lining / etc.
// rather than forcing an irrelevant clip. Output: handle → { youtube, title } (topical framing,
// the PDP shows "See it in action" + this title).
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(process.cwd())
const cats = JSON.parse(fs.readFileSync(path.join(ROOT, "data/categories.json"), "utf8"))
const rawArr = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalog-raw.json"), "utf8"))
const nameByHandle = {}
for (const p of rawArr) nameByHandle[p.handle] = (p.name || "").toLowerCase()

// Verified topic videos (oembed-checked 2026-06-28). Title = topical framing shown on the PDP.
const V = {
  cleaner:        { youtube: "QB9Cnd3tveU", title: "Robotic pool cleaners in action" },
  countercurrent: { youtube: "XA6-RKYSSkk", title: "Counter-current swim & jet systems" },
  spa:            { youtube: "-gjDP0tE7s4", title: "Hydromassage & spa hydrotherapy" },
  uv:             { youtube: "VS5xv43xrXg", title: "How UV pool sanitisation works" },
  vs_pump:        { youtube: "9We55HMXLp4", title: "How a variable-speed pool pump works" },
  sand_filter:    { youtube: "SdPf5JSe4Sw", title: "How a sand pool filter works (3D)" },
  cartridge_filter:{ youtube: "yDCT18Twk7Q", title: "How a pool cartridge filter works" },
  filter:         { youtube: "POVn8CEkPv8", title: "How pool filtration works" },
  heat_pump:      { youtube: "LhdpmYJlnNQ", title: "How a pool heat pump works" },
  led_light:      { youtube: "HL2SPbhhZBU", title: "Pool & spa LED lighting explained" },
  salt:           { youtube: "iMLNpocZ_00", title: "How salt-water chlorination works" },
  dosing:         { youtube: "2PNQiwvlZeM", title: "Automatic pH & chlorine dosing" },
  cover:          { youtube: "Kbk5BePIjck", title: "How an automatic pool cover works" },
}

const has = (s, ...words) => words.some((w) => s.includes(w))
// categories/names that should NEVER get a topic video (commodity / part / structural)
const isSkippable = (top, name) =>
  has(top, "spare part", "pipes & fittings", "fittings", "lining", "waterproof", "shell equipment",
      "ladders", "handrail", "water slide", "prefabricated", "accessories — ", "fountain nozzle") ||
  has(name, "spare part", " o-ring", "gasket", "seal kit", "impeller", "diffuser", "union ", "elbow",
      "coupling", "adhesive", "glue", "primer", "ladder", "handrail", "grating", "skimmer lid")

function pick(handle) {
  const chain = (cats[handle] || []).map((c) => (c.name || "").toLowerCase())
  const top = chain[0] || ""
  const sub = chain.slice(1).join(" | ")
  const all = chain.join(" | ")
  const name = nameByHandle[handle] || ""
  const text = `${all} ${name}`

  if (isSkippable(top, name)) return null

  // --- name/category rules, most specific first ---
  // Cleaners: automatic/robotic/suction/pressure — exclude manual brushes/hoses/poles
  if (has(text, "robotic", "automatic pool cleaner", "suction cleaner", "pressure cleaner", "pool vacuum") &&
      !has(name, "manual", "brush", "leaf rake", "telescopic", " hose", "pole")) return V.cleaner
  if (top.includes("pool cleaner") && !has(name, "manual", "brush", "rake", "telescopic", "pole", "net", " hose"))
    return V.cleaner

  // Counter-current / swim jets — match by NAME only (the category name "Counter Currents" must
  // not leak the swim-jet clip onto waterfalls/cascades in the same category).
  if (has(name, "counter current", "countercurrent", "counter-current", "swim jet", "jet swim",
          "swim machine", "swimming machine")) return V.countercurrent

  // Hydromassage jets → spa hydrotherapy clip (NAME only, same leak reason)
  if (has(name, "hydromassage", "hydro massage", "massage jet", "spa jet")) return V.spa

  // Spa / hot tub (NOT sauna/steam/heater)
  if (has(name, "hot tub", "whirlpool", "jacuzzi", "spa pool") ||
      (top.includes("spa") && has(name, "spa") && !has(name, "sauna", "steam", "heater"))) return V.spa

  // UV sanitiser
  if (has(name, "uv", "ultraviolet", "u.v")) return V.uv

  // Salt chlorinator / electrolysis
  if (has(text, "salt", "chlorinat", "electrolys", "chlorine generator")) return V.salt

  // Automatic dosing / measurement-control
  if (has(name, "dosing", "redox", "metering pump", "peristaltic", "measurement", "ph/", "ph & ", "controller") ||
      sub.includes("measurement") || sub.includes("dosing")) return V.dosing

  // Heaters: heat pumps only (electric/solar heaters get no clip)
  if (has(name, "heat pump", "heatpump", "inverter heat")) return V.heat_pump

  // Lighting (pool + pond/fountain LED)
  if (top.includes("lighting") || has(name, "led light", "underwater light", "pool light", "spotlight", "projector light"))
    return V.led_light

  // Filtration: sand / cartridge / generic
  if (top.includes("filtration") || has(name, "filter")) {
    if (has(text, "sand filter", "sand pool filter", "glass media", "filter media")) return V.sand_filter
    if (has(text, "cartridge")) return V.cartridge_filter
    if (has(name, "diatom", "d.e.", " de filter")) return V.filter
    if (top.includes("filtration")) return V.filter
  }

  // Pumps: circulation/variable-speed (exclude fountain pumps + heat already handled)
  if ((top.includes("pool pump") || has(name, "pool pump", "circulation pump", "variable speed", "self-priming pump")) &&
      !has(name, "fountain", "spare", "heat pump")) return V.vs_pump

  // Automatic covers / slatted covers / roller
  if (has(name, "automatic cover", "slatted cover", "slat cover", "roller cover", "automatic pool cover", "cover with rollers"))
    return V.cover

  return null
}

const out = {}
let n = 0
const byVideo = {}
for (const handle of Object.keys(cats)) {
  const v = pick(handle)
  if (v) {
    out[handle] = v
    n++
    byVideo[v.title] = (byVideo[v.title] || 0) + 1
  }
}
// also map handles that exist in catalog-raw but not categories.json (3 missing) via name only
for (const p of rawArr) {
  if (out[p.handle] || cats[p.handle]) continue
  // no category → skip (conservative)
}

fs.writeFileSync(path.join(ROOT, "data/product-videos.json"), JSON.stringify(out))
const dest = path.join(ROOT, "aquora-store/apps/storefront/src/lib/aquora/product-videos.json")
fs.writeFileSync(dest, JSON.stringify(out))
console.log(`Mapped ${n} / ${rawArr.length} products to a video.`)
console.log("By video:")
for (const [t, c] of Object.entries(byVideo).sort((a, b) => b[1] - a[1])) console.log(`  ${c.toString().padStart(4)}  ${t}`)
