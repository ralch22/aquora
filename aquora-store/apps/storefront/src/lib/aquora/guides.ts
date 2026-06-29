// Structured how-to & buying guides (Bunnings-style: difficulty · time · "what you'll need" →
// products · numbered steps). Original content grounded in standard pool knowledge; product
// references link to Aquora categories/search, never fabricated SKUs. Resolved server-side.

export type GuideLink = { label: string; href: string }
export type GuideStep = { title: string; body: string }
export type Guide = {
  slug: string
  title: string
  type: "how-to" | "buying"
  category: "Maintenance" | "Water care" | "Equipment" | "Seasonal"
  difficulty: "Easy" | "Moderate" | "Advanced"
  time: string
  excerpt: string
  intro: string
  whatYouNeed: GuideLink[]
  steps: GuideStep[]
  tip?: string
  related?: string[]
}

const CHEM = {
  chlorine: { label: "Chlorine & shock", href: "/search?cat=Pool%20chlorine" },
  ph: { label: "pH balancers", href: "/search?cat=Pool%20pH%20regulators" },
  algaecide: { label: "Algaecide", href: "/search?cat=Pool%20algaecide" },
  flocculant: { label: "Clarifier / flocculant", href: "/search?cat=Pool%20flocculant" },
  testers: { label: "Test kits", href: "/search?cat=Pool%20testers" },
  stabiliser: { label: "Stabiliser (CYA)", href: "/search?q=stabiliser%20cyanuric%20acid" },
}
const EQUIP = {
  pumps: { label: "Pool pumps", href: "/categories/pool-pumps" },
  filtration: { label: "Filtration", href: "/categories/pool-filtration-systems" },
  heaters: { label: "Pool heaters", href: "/categories/pool-heaters" },
  cleaners: { label: "Pool cleaners", href: "/categories/pool-cleaners" },
  chlorinators: { label: "Chlorinators & salt systems", href: "/search?cat=Pool%20chlorinators" },
  lighting: { label: "Pool lighting", href: "/categories/pool-lighting" },
}

export const guides: Guide[] = [
  {
    slug: "how-to-maintain-your-pool",
    title: "How to maintain your pool: a simple weekly routine",
    type: "how-to",
    category: "Maintenance",
    difficulty: "Easy",
    time: "About 30 minutes a week",
    excerpt: "A straightforward weekly routine to keep your pool clear, balanced and swim-ready all season.",
    intro:
      "Most pool problems are easier to prevent than to fix. A short, consistent weekly routine keeps the water clear, protects your equipment and means you almost never face a green pool. Here's the routine our specialists recommend for UAE pools.",
    whatYouNeed: [CHEM.testers, CHEM.chlorine, CHEM.ph, EQUIP.cleaners],
    steps: [
      { title: "Skim and empty the baskets", body: "Skim the surface, empty the skimmer and pump baskets, and brush the walls and floor to lift debris into suspension where the filter can catch it." },
      { title: "Run the cleaner", body: "Run your robotic or suction cleaner, or vacuum manually, to pick up settled dirt. In peak summer, run the filter longer — aim to turn the whole pool over at least once a day." },
      { title: "Test the water", body: "Test free chlorine and pH at least twice a week (more in heat or after heavy use). Keep chlorine 1–3 ppm and pH 7.2–7.6." },
      { title: "Balance and sanitise", body: "Adjust pH first, then top up chlorine. Use our dosing calculator for exact amounts for your pool volume." },
      { title: "Check the equipment", body: "Glance at the pump, filter pressure and skimmer weir. A jump in filter pressure means it's time to clean or backwash." },
    ],
    tip: "Test at the same time of day each week — consistency makes trends easy to spot before they become problems.",
    related: ["get-your-pool-summer-ready", "how-to-fix-a-green-pool", "how-to-clean-and-backwash-a-sand-filter"],
  },
  {
    slug: "get-your-pool-summer-ready",
    title: "How to get your pool summer-ready",
    type: "how-to",
    category: "Seasonal",
    difficulty: "Moderate",
    time: "Half a day",
    excerpt: "Open up, deep-clean and balance your pool so it's crystal clear for the first swim of the season.",
    intro:
      "Before the season really heats up, a proper open-up gets your pool clear and your equipment running efficiently. Work through these steps in order and you'll start summer with balanced, sparkling water.",
    whatYouNeed: [CHEM.testers, CHEM.chlorine, CHEM.ph, CHEM.flocculant, EQUIP.filtration],
    steps: [
      { title: "Clean thoroughly", body: "Remove any cover, skim, brush and vacuum. Clear leaves and debris from baskets and around the pool." },
      { title: "Check the equipment", body: "Inspect the pump, filter and (if fitted) the salt cell. Clean or replace filter media if it's been a while, and de-scale the salt cell if needed." },
      { title: "Top up and circulate", body: "Bring the water to the correct level (mid-skimmer) and run the filter continuously while you balance." },
      { title: "Balance the water", body: "Test and correct alkalinity, then pH, then calcium and stabiliser. Our dosing calculator gives exact amounts for your volume." },
      { title: "Shock and clarify", body: "Shock with chlorine to clear any winter build-up. If the water is cloudy, add a clarifier and keep filtering until it's clear." },
    ],
    tip: "In the UAE sun, make sure stabiliser (cyanuric acid) is in range — without it, your chlorine burns off within hours.",
    related: ["how-to-maintain-your-pool", "how-to-fix-a-green-pool"],
  },
  {
    slug: "how-to-fix-a-green-pool",
    title: "How to fix a green pool, fast",
    type: "how-to",
    category: "Water care",
    difficulty: "Moderate",
    time: "1–3 days",
    excerpt: "Bring a green, algae-filled pool back to clear with a proven shock-and-filter routine.",
    intro:
      "A green pool means algae has taken hold because the sanitiser dropped too low. The good news: it's almost always recoverable at home with the right sequence. Don't swim until the water is clear and balanced.",
    whatYouNeed: [CHEM.testers, CHEM.chlorine, CHEM.algaecide, CHEM.flocculant],
    steps: [
      { title: "Balance the pH first", body: "Chlorine works best at pH 7.2–7.6, so correct pH before you shock — otherwise much of the chlorine is wasted." },
      { title: "Shock hard", body: "Add a strong dose of chlorine (follow the label for your volume) in the evening so the sun doesn't burn it off. Run the pump continuously." },
      { title: "Add algaecide", body: "Add an algaecide to kill remaining algae and help prevent regrowth." },
      { title: "Filter and clean", body: "Run the filter 24–48 hours, backwashing or cleaning it as it loads up. Brush and vacuum settled debris." },
      { title: "Clarify and re-test", body: "If the water turns cloudy-blue (dead algae), add a clarifier and keep filtering. Re-test and balance before swimming." },
    ],
    tip: "Once it's clear, the only way to keep it clear is consistent chlorine — use the problem solver if it keeps coming back.",
    related: ["how-to-maintain-your-pool", "how-to-clean-and-backwash-a-sand-filter"],
  },
  {
    slug: "how-to-clean-and-backwash-a-sand-filter",
    title: "How to clean and backwash a sand filter",
    type: "how-to",
    category: "Maintenance",
    difficulty: "Easy",
    time: "About 20 minutes",
    excerpt: "Restore your sand filter's flow and clarity with a proper backwash and rinse.",
    intro:
      "Over time, a sand filter traps so much dirt that water flow drops and pressure rises. Backwashing flushes the trapped dirt out to waste. Do it when the pressure gauge reads about 7–10 psi above its clean baseline.",
    whatYouNeed: [EQUIP.filtration, EQUIP.pumps],
    steps: [
      { title: "Turn the pump off", body: "Always stop the pump before moving the multiport valve — switching under pressure can damage it." },
      { title: "Set to Backwash", body: "Turn the multiport valve to 'Backwash'. Make sure the waste line is directed appropriately." },
      { title: "Backwash", body: "Run the pump for about 2 minutes until the sight glass runs clear, then turn the pump off." },
      { title: "Rinse", body: "Set the valve to 'Rinse' and run for about 30 seconds to settle the sand bed, then turn the pump off." },
      { title: "Return to Filter", body: "Set the valve back to 'Filter' and restart the pump. Top up any water lost during backwashing." },
    ],
    tip: "Sand loses its edge after roughly 5–7 years and filters less effectively — if clarity suffers despite good chemistry, it may be time to replace the media.",
    related: ["how-to-maintain-your-pool", "choosing-a-pool-filter"],
  },
  {
    slug: "how-to-choose-a-pool-pump",
    title: "How to choose the right pool pump",
    type: "buying",
    category: "Equipment",
    difficulty: "Easy",
    time: "5-minute read",
    excerpt: "Match a pump to your pool's size and plumbing — and why variable-speed pays for itself.",
    intro:
      "The pump is the heart of your pool. The right one circulates and filters all your water efficiently without wasting energy. Here's how to choose.",
    whatYouNeed: [EQUIP.pumps, EQUIP.filtration],
    steps: [
      { title: "Size it to your volume", body: "Aim to turn the whole pool over in about 6 hours, so required flow (m³/h) ≈ pool volume ÷ 6. Our sizing calculator does this for you." },
      { title: "Match it to your filter", body: "The pump's flow must not exceed your filter's rated flow, or you'll force dirt through and shorten the filter's life." },
      { title: "Choose variable-speed", body: "A variable-speed pump runs slow and quiet for everyday filtering and fast only when needed — typically cutting running costs by 50–80% versus a single-speed pump. It usually pays back within a couple of seasons." },
      { title: "Check the plumbing", body: "Confirm the inlet/outlet sizes and self-priming height suit your installation, especially if the pump sits above water level." },
    ],
    tip: "If you're replacing an old single-speed pump, a variable-speed model is almost always the better long-term buy in the UAE's long swim season.",
    related: ["choosing-a-pool-filter", "how-to-choose-a-pool-heater"],
  },
  {
    slug: "choosing-a-pool-filter",
    title: "Sand, cartridge or DE: choosing a pool filter",
    type: "buying",
    category: "Equipment",
    difficulty: "Easy",
    time: "5-minute read",
    excerpt: "The three filter types compared, so you can pick the right balance of clarity and upkeep.",
    intro:
      "Your filter keeps the water clear by trapping the dirt your pump circulates. The three common types — sand, cartridge and DE — trade off filtration fineness against maintenance. Here's how they compare.",
    whatYouNeed: [EQUIP.filtration, EQUIP.pumps],
    steps: [
      { title: "Sand filters", body: "The most popular and lowest-maintenance choice. You clean them by backwashing (no parts to scrub). They filter to around 20–40 microns — perfectly clear for most pools." },
      { title: "Cartridge filters", body: "Filter finer (around 10–20 microns) and use no water to clean — you just remove and hose the cartridge. Great where water is precious, with a little more hands-on cleaning." },
      { title: "DE (diatomaceous earth) filters", body: "Filter the finest (down to a few microns) for glass-clear water, but need more upkeep and DE powder top-ups. Best for owners who want the ultimate clarity." },
      { title: "Match it to your pump", body: "Whatever you choose, size the filter's rated flow to your pump so it isn't the bottleneck." },
    ],
    tip: "For most UAE pools, a correctly sized sand filter is the easy, reliable default — pair it with a variable-speed pump.",
    related: ["how-to-choose-a-pool-pump", "how-to-clean-and-backwash-a-sand-filter"],
  },
  {
    slug: "how-to-choose-a-pool-heater",
    title: "How to choose a pool heater or heat pump",
    type: "buying",
    category: "Equipment",
    difficulty: "Easy",
    time: "5-minute read",
    excerpt: "Extend your swim season — how to pick between heat pumps and electric heaters, and size it right.",
    intro:
      "A heater extends your swim season into the cooler months and takes the chill off shoulder-season mornings. For most UAE pools, an inverter heat pump is the efficient choice. Here's how to choose.",
    whatYouNeed: [EQUIP.heaters],
    steps: [
      { title: "Heat pump vs electric", body: "A heat pump moves heat from the air into the water and is far cheaper to run than a resistive electric heater for ongoing heating — ideal for maintaining temperature over the season." },
      { title: "Size it to your pool", body: "Heater output depends on your pool volume, your target temperature, the climate and whether you use a cover. Our sizing calculator gives an indicative kW range to start from." },
      { title: "Use a cover", body: "A pool cover dramatically cuts heat loss (and evaporation), so a smaller, cheaper-to-run heater can hold temperature — well worth pairing." },
      { title: "Check noise and placement", body: "Heat pumps need airflow and have a fan, so plan placement for ventilation and to keep noise away from living areas." },
    ],
    tip: "Heating from cold takes far more energy than maintaining temperature — a cover plus a right-sized heat pump is the efficient combination.",
    related: ["how-to-choose-a-pool-pump", "salt-vs-chlorine"],
  },
  {
    slug: "salt-vs-chlorine",
    title: "Salt vs chlorine: choosing how to sanitise your pool",
    type: "buying",
    category: "Water care",
    difficulty: "Easy",
    time: "4-minute read",
    excerpt: "Both keep your pool safe with chlorine — the difference is how that chlorine is delivered.",
    intro:
      "A common myth is that a 'salt pool' is chlorine-free. In fact, a salt chlorinator makes its own chlorine from salt in the water — so both systems sanitise with chlorine. The difference is convenience versus simplicity.",
    whatYouNeed: [EQUIP.chlorinators, CHEM.chlorine, CHEM.testers],
    steps: [
      { title: "How salt chlorination works", body: "A chlorinator passes the salted water over a cell that converts salt into chlorine automatically, then it reverts to salt — a continuous, hands-off cycle." },
      { title: "Salt system: pros", body: "Lower day-to-day effort, steadier chlorine levels, and water that many find gentler on eyes and skin. Higher upfront cost; the cell needs occasional cleaning and eventual replacement." },
      { title: "Manual chlorine: pros", body: "Lower upfront cost and simple to start — you dose chlorine yourself. It needs more frequent testing and topping up, especially in the heat." },
      { title: "Either way, balance the water", body: "Both systems still need balanced pH, alkalinity and stabiliser to work well and protect your pool." },
    ],
    tip: "For a hands-off pool in a long, hot swim season, many UAE owners prefer a salt chlorinator — just keep an eye on the cell and stabiliser.",
    related: ["how-to-maintain-your-pool", "how-to-choose-a-pool-heater"],
  },
  {
    slug: "how-to-choose-a-robotic-cleaner",
    title: "How to choose a robotic pool cleaner",
    type: "buying",
    category: "Equipment",
    difficulty: "Easy",
    time: "5-minute read",
    excerpt: "Hands-off cleaning that scrubs, vacuums and filters on its own — how to pick the right robot.",
    intro:
      "A robotic cleaner is the easiest way to keep your pool spotless. Unlike suction or pressure cleaners, it runs on its own low-voltage motor — independent of your pump — and filters debris into its own basket. Here's how to choose one.",
    whatYouNeed: [EQUIP.cleaners],
    steps: [
      { title: "Match it to your pool size", body: "Check the cleaner's rated pool length and surface area. An undersized robot will take longer and may miss areas; size up for larger pools." },
      { title: "Floor only, or walls and waterline too", body: "Entry models clean the floor; mid and premium models climb walls and scrub the waterline. For a thorough clean, choose wall-climbing." },
      { title: "Filtration and debris type", body: "Fine filter baskets catch dust and silt (ideal for the UAE); larger debris (leaves) needs a coarser basket. Some models offer both." },
      { title: "Features that save effort", body: "Look for easy top-load baskets, tangle-free or floating cables, smart navigation and a caddy for storage. These make day-to-day use much easier." },
    ],
    tip: "A robotic cleaner also lightens the load on your pump and filter — letting you run the pump at lower speeds and save energy.",
    related: ["how-to-maintain-your-pool", "how-to-choose-a-pool-pump"],
  },
  {
    slug: "lower-your-pool-running-costs",
    title: "How to lower your pool's running costs",
    type: "how-to",
    category: "Maintenance",
    difficulty: "Easy",
    time: "Ongoing",
    excerpt: "Simple changes that cut energy, water and chemical costs without sacrificing a clear pool.",
    intro:
      "The pump and heater are the biggest energy users in any pool, and the UAE sun drives up evaporation and chemical demand. A few smart changes can noticeably cut your running costs while keeping the water perfect.",
    whatYouNeed: [EQUIP.pumps, EQUIP.heaters],
    steps: [
      { title: "Switch to a variable-speed pump", body: "Running a pump slowly for longer filters just as well while using a fraction of the energy — typically 50–80% less than a single-speed pump." },
      { title: "Use a pool cover", body: "A cover slashes evaporation (saving water and chemicals) and heat loss (cutting heater costs). It's one of the highest-return upgrades you can make." },
      { title: "Right-size and time your filtration", body: "Run the filter enough to turn the water over once a day — often less than people think. Avoid over-running the pump out of habit." },
      { title: "Keep chemistry balanced", body: "Balanced water means chlorine and equipment work efficiently. Reactive 'fix it' dosing after a problem costs far more than steady maintenance." },
    ],
    tip: "Stabiliser (CYA) in range protects chlorine from the sun — without it you'll spend far more on sanitiser through summer.",
    related: ["how-to-choose-a-pool-pump", "how-to-maintain-your-pool"],
  },
  {
    slug: "how-to-choose-pool-lighting",
    title: "How to choose pool lighting",
    type: "buying",
    category: "Equipment",
    difficulty: "Easy",
    time: "4-minute read",
    excerpt: "Transform your pool after dark — choosing LED lights, colour and placement.",
    intro:
      "The right lighting turns a pool into the centrepiece of your evening and makes night swimming safer. Modern LED pool lights are efficient, long-lasting and come in white or colour-changing options. Here's how to choose.",
    whatYouNeed: [EQUIP.lighting],
    steps: [
      { title: "White or colour-changing (RGB)", body: "White light is clean and classic; RGB lets you set moods and scenes. Many RGB lights also do a steady white when you want it." },
      { title: "Match the fitting to your pool", body: "Choose lights designed for your pool type (concrete, liner or fibreglass) and the correct niche or surface-mount fitting and voltage (usually low-voltage 12V for safety)." },
      { title: "Brightness and coverage", body: "Larger pools need more lumens or multiple lights for even coverage. Plan placement to avoid glare toward seating areas." },
      { title: "Control", body: "Look for remote or app control and the ability to sync multiple lights so colours and scenes change together." },
    ],
    tip: "Always have pool electrical work done by a qualified electrician — low-voltage fittings and proper bonding keep night swims safe.",
    related: ["how-to-choose-a-pool-pump", "how-to-choose-a-pool-heater"],
  },
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const BY_SLUG: Record<string, Guide> = {}
for (const g of guides) BY_SLUG[norm(g.slug)] = g

export function getGuide(slug?: string | null): Guide | undefined {
  if (!slug) return undefined
  return BY_SLUG[norm(slug)]
}
export function listGuides(): Guide[] {
  return guides
}
