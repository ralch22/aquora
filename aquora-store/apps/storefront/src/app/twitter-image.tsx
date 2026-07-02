import { renderDefaultOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@lib/og/card"

// Same branded card for Twitter/X shares (summary_large_image).

export const alt = "Aquora — Pool, Spa & Fountain Equipment in the UAE"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderDefaultOgCard()
}
