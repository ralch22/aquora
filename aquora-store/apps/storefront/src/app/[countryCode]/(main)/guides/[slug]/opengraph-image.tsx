import { getGuide } from "@lib/aquora/guides"
import {
  renderOgCard,
  renderDefaultOgCard,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@lib/og/card"

// Branded share card for how-to / buying guides: guide title on the Aquora card.

export const alt = "Aquora pool guide"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string; countryCode: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return renderDefaultOgCard()
  return renderOgCard({
    title: guide.title,
    subtitle: guide.excerpt,
    eyebrow: "Pool care guide",
  })
}
