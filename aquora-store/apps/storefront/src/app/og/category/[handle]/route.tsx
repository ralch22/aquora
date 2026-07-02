import { getCategoryByHandle } from "@lib/data/categories"
import { renderOgCard, renderDefaultOgCard } from "@lib/og/card"

// Branded share card for category pages. A route handler (not a colocated
// opengraph-image.tsx) because the category page lives in a catch-all segment
// ([...category]) and Next.js can't append the image segment after a catch-all.
// Referenced from the category page's generateMetadata via openGraph.images.

type Props = { params: Promise<{ handle: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { handle } = await params
  let card: Response
  try {
    const productCategory = await getCategoryByHandle([handle])
    card = productCategory?.name
      ? await renderOgCard({
          title: productCategory.name,
          subtitle:
            "Engineered pool, spa and fountain equipment — delivered across the UAE & GCC.",
          eyebrow: "Shop the range",
        })
      : await renderDefaultOgCard()
  } catch {
    card = await renderDefaultOgCard()
  }
  // Cacheable at the edge; category names effectively never change.
  card.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400")
  return card
}
