import videosRaw from "./product-videos.json"

// Sourced product videos (from waterstore.ae's /video/ library), mapped to the matching
// product types (cleaners, counter-currents, hot tubs, UV sanitizers). Resolved server-side
// by handle so the map never ships in the client bundle. See scripts/ (product-videos.json).
export type ProductVideoData = { youtube: string; title: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const INDEX: Record<string, ProductVideoData> = {}
for (const [h, v] of Object.entries(videosRaw as Record<string, ProductVideoData>)) {
  INDEX[norm(h)] = v
}

export function getProductVideo(handle?: string | null): ProductVideoData | undefined {
  if (!handle) return undefined
  return INDEX[norm(handle)]
}
