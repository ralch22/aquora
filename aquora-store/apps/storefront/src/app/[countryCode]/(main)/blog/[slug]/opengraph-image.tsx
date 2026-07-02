import {
  listBlogSlugs,
  readContentMarkdown,
  extractTitle,
  extractExcerpt,
} from "../_lib/markdown"
import {
  renderOgCard,
  renderDefaultOgCard,
  OG_SIZE,
  OG_CONTENT_TYPE,
} from "@lib/og/card"

// Branded share card for blog articles: article title on the Aquora card.

export const alt = "Aquora insights & guides"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Props = { params: Promise<{ slug: string; countryCode: string }> }

export default async function Image({ params }: Props) {
  const { slug } = await params
  try {
    if (listBlogSlugs().includes(slug)) {
      const md = readContentMarkdown(`blog/${slug}.md`)
      return renderOgCard({
        title: extractTitle(md, slug.replace(/-/g, " ")),
        subtitle: extractExcerpt(md, 140),
        eyebrow: "Insights & guides",
      })
    }
  } catch {
    // fall through to the default card
  }
  return renderDefaultOgCard()
}
