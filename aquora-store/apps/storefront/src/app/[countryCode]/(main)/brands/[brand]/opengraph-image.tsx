import { findBrandBySlug } from "@lib/aquora/brands"
import {
  renderOgCard,
  renderDefaultOgCard,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@lib/og/card"

// Branded share card for brand pages: brand name + catalogue size on the Aquora card.

export const alt = "Shop by brand at Aquora"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = { params: Promise<{ brand: string; countryCode: string }> }

export default async function Image({ params }: Props) {
  const { brand: slug } = await params
  const brand = findBrandBySlug(slug)
  if (!brand) return renderDefaultOgCard()
  return renderOgCard({
    title: brand.name,
    subtitle: `${brand.count} genuine ${brand.name} pool, spa and water-feature products, supplied and supported across the UAE & GCC.`,
    eyebrow: "Shop by brand",
  })
}
