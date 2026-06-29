// Representative product image per top-level category — pulled from the live catalogue (the first
// product shown on each category page). Used for photographic category tiles (home CategoryGrid)
// and mega-menu thumbnails, matching how big-box retailers merchandise categories with imagery.
// All are real GCS product photos (object-contain, white background) — no AI, no stock.
const GCS = "https://storage.googleapis.com/"

export const categoryImages: Record<string, string> = {
  "pvc-pipes-and-fittings": GCS + "emerge-aquora-products/cepex-pvc-u-threaded-reducing-coupling-1-x10/0.webp",
  "pool-and-pond-lining-waterproofing": GCS + "emerge-aquora-products/rosa-gres-mistery-grey-l98-porcelain-stoneware-edge-for-swimming-pool-97-9-x-31-7-x-3-8-cm-anti-slip/0.webp",
  "pool-shell-equipment": GCS + "emerge-aquora-products/behncke-floor-drain-pot-type-190-sideways/0.webp",
  "pool-filtration-systems": GCS + "emerge-aquora-products/behncke-cristall2-filter-container-for-swimming-pool-o-600/0.webp",
  "pool-heaters": GCS + "emerge-aquora-products/behncke-ewt-80-71-electric-heater-with-control-thermostat-and-flow-switch-for-swimming-pool-9-kw/0.webp",
  "pool-lighting": GCS + "emerge-aquora-products/atecpool-square-connection-box-stainless-steel-34-threaded/0.webp",
  "pool-pumps": GCS + "emerge-aquora-products/speck-badu-gamma-eco-vs-pump-for-pool-1-40-kw-24-m3h-2-hp/0.webp",
  "waterfalls-counter-currents-systems-hydromassage-systems": GCS + "emerge-aquora-products/atecpool-12-arch-waterfall-with-6-lip-14-gpm/0.webp",
  "water-treatment-equipment": GCS + "emerge-aquora-products/atecpool-atec-uv-series-stainless-steel-reactor-uv-sanitizer-105-w-25-mh/0.webp",
  "hot-tubs-saunas-steam-generators-electric-sauna-heaters": GCS + "emerge-aquora-products/astralpool-swimspa-compact-above-ground-spafor-external-kit-with-steel-jets-and-cover-400-x-230-x-138-1-place/0.webp",
  "fountain-nozzles": GCS + "emerge-aquora-products/astralpool-bouquet-nozzle-for-fountains-2-o-204-mm/0.webp",
  "pool-cleaners": GCS + "emerge-aquora-products/dolphin-scoop-smart-robotic-swimming-pool-cleaner-12-15-m/0.webp",
  "pond-lighting": GCS + "emerge-aquora-products/astral-pool-circular-flat-mounted-light-for-fountains-o-200-mm/0.webp",
  "pump-parts": GCS + "emerge-aquora-products/astralpool-motor-1-5-hp-iii/0.webp",
  "ladders-and-handrails": GCS + "emerge-aquora-products/aqua-industrial-stainless-steel-ladder-for-inground-pools-5-treads-316l/0.webp",
  "pool-covers": GCS + "emerge-aquora-products/aqua-industrial-midas-500-geobubble-solar-cover/0.webp",
}

export const categoryImage = (handle: string): string | undefined => categoryImages[handle]
