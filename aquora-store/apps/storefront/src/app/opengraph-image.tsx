import { renderDefaultOgCard, OG_SIZE, OG_CONTENT_TYPE } from "@lib/og/card"

// Site-wide fallback OG image: any route without its own opengraph-image or explicit
// openGraph.images (store, search, brand/blog indexes, about, services, faq, contact,
// legal, cart, checkout, 404…) inherits this branded card. Replaces the Medusa starter
// "Next.js Starter Template" JPEG that previously leaked on every shared link.

export const alt = "Aquora — Pool, Spa & Fountain Equipment in the UAE"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderDefaultOgCard()
}
