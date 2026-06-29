import React from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import ProductJsonLd from "@modules/products/components/product-jsonld"
import TrustStrip from "@modules/products/components/trust-strip"
import KeyFeatures from "@modules/products/components/key-features"
import WishlistButton from "@modules/products/components/wishlist-button"
import CompareButton from "@modules/products/components/compare-button"
import FrequentlyBoughtTogether from "@modules/products/components/frequently-bought-together"
import Reviews from "@modules/products/components/reviews"
import Questions from "@modules/products/components/questions"
import ProductVideo from "@modules/products/components/product-video"
import { getProductVideo } from "@lib/aquora/videos"
import RecommendedRail from "@modules/home/components/recommended-rail"
import RecentlyViewed from "@modules/home/components/recently-viewed"
import Reveal from "@modules/common/components/reveal"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <ProductJsonLd product={product} />
      <div
        className="content-container  flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
      >
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
          <ProductInfo product={product} />
          <KeyFeatures product={product} />
          <ProductTabs product={product} />
        </div>
        <div className="block w-full relative">
          <ImageGallery images={images} title={product.title} />
        </div>
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
          <ProductOnboardingCta />
          {/* Inline, NOT a streamed <Suspense> — deferred Suspense boundaries never get React's
              `$RC` completion script in this deployment, which would leave Add-to-cart stuck on
              the disabled fallback (purchase blocked). Resolving pricing inline before the shell
              flush makes the buy buttons paint AND hydrate. */}
          <ProductActionsWrapper id={product.id} region={region} />
          <div className="flex items-center gap-3">
            <WishlistButton handle={product.handle} />
            <CompareButton handle={product.handle} />
          </div>
          <TrustStrip product={product} />
        </div>
      </div>
      <Reveal>
        <ProductVideo video={getProductVideo(product.handle)} />
      </Reveal>
      <Reveal>
        <Reviews productId={product.id} productTitle={product.title} />
      </Reveal>
      <Reveal>
        <Questions productId={product.id} productTitle={product.title} />
      </Reveal>
      <Reveal>
        <div className="content-container my-16 small:my-32" data-testid="related-products-container">
          <RelatedProducts product={product} countryCode={countryCode} />
        </div>
      </Reveal>
      <Reveal>
        <div className="content-container mb-16 small:mb-32">
          <FrequentlyBoughtTogether product={product} countryCode={countryCode} />
        </div>
      </Reveal>
      {/* Personalized "others you may like" — Retail Predict (recently-viewed) with a
          complementary-category content fallback. */}
      <RecommendedRail
        handle={product.handle}
        eyebrow="You may also like"
        title="Customers also consider"
      />
      <RecentlyViewed exclude={product.handle} />
    </>
  )
}

export default ProductTemplate
