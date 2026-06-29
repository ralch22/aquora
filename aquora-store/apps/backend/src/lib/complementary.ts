// Backend copy of the storefront's honest complementary-category map (top category handle ->
// related top category handles). The storefront copy (apps/storefront/src/lib/aquora/
// complementary.ts) can't be imported across apps, so this zero-dep const is duplicated.
// Drives the agent's recommend_complementary tool (filter for a pump, etc.) — NOT fabricated
// order data. Keep in sync with the storefront copy.
export const COMPLEMENTARY: Record<string, string[]> = {
  "pool-pumps": ["pool-filtration-systems", "pump-parts"],
  "pool-filtration-systems": ["pool-pumps", "water-treatment-equipment"],
  "pool-heaters": ["pool-covers", "water-treatment-equipment"],
  "pool-lighting": ["water-treatment-equipment", "pool-cleaners"],
  "water-treatment-equipment": ["pool-filtration-systems", "pool-pumps"],
  "pool-cleaners": ["water-treatment-equipment", "pump-parts"],
  "pool-shell-equipment": ["pool-filtration-systems", "pvc-pipes-and-fittings"],
  "pvc-pipes-and-fittings": ["pool-pumps", "pool-filtration-systems"],
  "pool-and-pond-lining-waterproofing": ["pool-shell-equipment", "pvc-pipes-and-fittings"],
  "waterfalls-counter-currents-systems-hydromassage-systems": ["pool-pumps", "pool-lighting"],
  "hot-tubs-saunas-steam-generators-electric-sauna-heaters": ["water-treatment-equipment", "pool-heaters"],
  "fountain-nozzles": ["pond-lighting", "pool-pumps"],
  "pond-lighting": ["fountain-nozzles", "water-treatment-equipment"],
  "pump-parts": ["pool-pumps", "pool-filtration-systems"],
  "ladders-and-handrails": ["pool-covers", "pool-shell-equipment"],
  "pool-covers": ["pool-heaters", "ladders-and-handrails"],
};
