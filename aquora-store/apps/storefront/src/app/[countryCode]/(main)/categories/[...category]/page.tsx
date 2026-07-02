import { Metadata } from "next"
import { notFound } from "next/navigation"

// Render category pages on demand so the build never depends on the backend being
// reachable at build time (avoids "Failed to collect page data" during deploy builds).
export const dynamic = "force-dynamic"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { buildAlternates } from "@lib/util/seo"
import { parseFacetFilters } from "@lib/util/facet-filters"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      sortBy?: SortOptions
      page?: string
      optionValueIds?: string | string[]
    }
  >
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: HttpTypes.StoreProductCategory) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: string) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const description =
      productCategory.description ??
      `${productCategory.name} — engineered pool, spa and fountain equipment from Aquora, delivered across the UAE and the GCC.`

    // Branded share card served by /og/category/[handle] (a colocated opengraph-image
    // file is impossible inside this catch-all segment). Relative URL resolves against
    // the root layout's metadataBase.
    const leafHandle = params.category[params.category.length - 1]
    const ogImage = {
      url: `/og/category/${leafHandle}`,
      width: 1200,
      height: 630,
      alt: `${productCategory.name} at Aquora`,
    }

    return {
      title: `${productCategory.name} | Aquora`,
      description: description.slice(0, 160),
      alternates: await buildAlternates(
        `/categories/${params.category.join("/")}`,
        params.countryCode
      ),
      openGraph: {
        title: `${productCategory.name} | Aquora`,
        description: description.slice(0, 160),
        type: "website",
        images: [ogImage],
      },
      twitter: {
        card: "summary_large_image",
        title: `${productCategory.name} | Aquora`,
        description: description.slice(0, 160),
        images: [ogImage.url],
      },
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)
  const facetFilters = parseFacetFilters(searchParams)

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
      facetFilters={facetFilters}
    />
  )
}
