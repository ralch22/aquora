import { Metadata } from "next"

import BannerCarousel from "@modules/home/components/banner-carousel"
import { type ImageBannerProps } from "@modules/common/components/image-banner"
import ProductBanner from "@modules/common/components/product-banner"
import CampaignBanner from "@modules/home/components/campaign-banner"
import BrandStrip from "@modules/home/components/brand-strip"
import ProductShelf from "@modules/home/components/product-shelf"
import ShopByNeed from "@modules/home/components/shop-by-need"
import CategoryGrid from "@modules/home/components/category-grid"
import BrandStory from "@modules/home/components/brand-story"
import StatsBand from "@modules/home/components/stats-band"
import EditorialSections from "@modules/home/components/editorial-sections"
import GuidesResources from "@modules/home/components/guides-resources"
import RecommendedRail from "@modules/home/components/recommended-rail"
import RecentlyViewed from "@modules/home/components/recently-viewed"
import PoolCarePromo from "@modules/home/components/pool-care-promo"
import AskAqua from "@modules/home/components/ask-aqua"
import TrustBand from "@modules/home/components/trust-band"
import Reveal from "@modules/common/components/reveal"

export const metadata: Metadata = {
  title: "Aquora — Pool, Spa & Fountain Equipment in the UAE",
  description:
    "Aquora supplies premium, genuinely engineered pool, spa, pond and fountain equipment across Dubai and the GCC — pumps, filtration, heating, automation and expert technical support.",
  openGraph: {
    title: "Aquora — Engineered Pool, Spa & Fountain Equipment",
    description:
      "Genuinely engineered pool, spa, pond and fountain equipment, stocked and supported across the UAE & GCC.",
    // Branded hero card (pool photo + wordmark) — JPEG for maximum crawler support.
    images: [
      {
        url: "/images/brand/og-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Aquora — engineered for water that lasts",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquora — Engineered Pool, Spa & Fountain Equipment",
    description:
      "Genuinely engineered pool, spa, pond and fountain equipment, stocked and supported across the UAE & GCC.",
    images: ["/images/brand/og-hero.jpg"],
  },
}

const HOME_BANNERS: ImageBannerProps[] = [
  {
    image: "/images/brand/hero-bg.webp",
    imageAlt: "A pristine swimming pool ready for summer",
    eyebrow: "In season",
    headline: "Get your pool summer-ready",
    text: "Everything to open, balance and enjoy your pool this season — genuine, engineered equipment delivered fast across the UAE.",
    cta: { label: "Shop the essentials", href: "/store" },
    secondaryCta: { label: "Pool Care", href: "/pool-care" },
    align: "left",
    focus: "center",
  },
  {
    image: "/images/brand/editorial-delivery.webp",
    imageAlt: "Aquora pool equipment delivered across the UAE",
    eyebrow: "Across the Emirates",
    headline: "Free delivery over AED 500",
    text: "Genuine pool, spa and fountain equipment — stocked, supported and delivered fast across the UAE & GCC.",
    cta: { label: "Start shopping", href: "/store" },
    align: "left",
    focus: "center",
  },
  {
    image: "/images/brand/editorial-support.webp",
    imageAlt: "Aquora pool care tools and expert support",
    eyebrow: "Free tools & expert help",
    headline: "Balance, fix & size your pool",
    text: "Free dosing calculator, problem solver and Aqua — our AI advisor. Get the right answer in minutes.",
    cta: { label: "Explore Pool Care", href: "/pool-care" },
    secondaryCta: { label: "Browse guides", href: "/guides" },
    align: "left",
    focus: "center",
  },
  {
    image: "/images/brand/editorial-equipment.webp",
    imageAlt: "Genuine pool equipment from the brands the Gulf trusts",
    eyebrow: "The brands the Gulf trusts",
    headline: "Genuine, engineered equipment",
    text: "Hayward, Pentair, AstralPool, Zodiac, Speck and more — authentic, warrantied and supported by our team.",
    cta: { label: "Shop the brands", href: "/brands" },
    secondaryCta: { label: "Browse the store", href: "/store" },
    align: "left",
    focus: "center",
  },
  {
    image: "/images/brand/editorial-install.webp",
    imageAlt: "Aquora specialists installing pool equipment",
    eyebrow: "Design · install · support",
    headline: "Expert help, start to finish",
    text: "Our specialists help you spec, install and look after your pool — from a single pump to a full fit-out.",
    cta: { label: "See our services", href: "/services" },
    align: "left",
    focus: "center",
  },
]

export default async function Home({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  return (
    <>
      <BannerCarousel banners={HOME_BANNERS} />
      <BrandStrip />
      <Reveal>
        <ProductShelf
          countryCode={countryCode}
          handle="pool-cleaners"
          eyebrow="In the spotlight"
          title="Robotic cleaners & most-wanted gear"
        />
      </Reveal>
      <Reveal>
        <CampaignBanner />
      </Reveal>
      <Reveal>
        <ShopByNeed />
      </Reveal>
      <Reveal>
        <PoolCarePromo />
      </Reveal>
      <RecommendedRail />
      <CategoryGrid />
      <Reveal>
        <div className="content-container py-6 small:py-10">
          <ProductBanner
            image="https://storage.googleapis.com/emerge-aquora-products/dolphin-scoop-smart-robotic-swimming-pool-cleaner-12-15-m/0.webp"
            imageAlt="Dolphin Scoop Smart robotic pool cleaner"
            eyebrow="In the spotlight"
            headline="Hands-off, spotless pools"
            text="Robotic cleaners that scrub, vacuum and filter on their own — the easiest way to keep your pool perfect, with no extra load on your pump."
            cta={{ label: "Shop robotic cleaners", href: "/categories/pool-cleaners" }}
            secondaryCta={{ label: "Which one's right?", href: "/guides/how-to-choose-a-robotic-cleaner" }}
            imageSide="right"
          />
        </div>
      </Reveal>
      <Reveal>
        <ProductShelf
          countryCode={countryCode}
          handle="pool-pumps"
          eyebrow="Circulation"
          title="Pumps that keep water moving"
        />
      </Reveal>
      <Reveal>
        <BrandStory />
      </Reveal>
      <Reveal>
        <StatsBand />
      </Reveal>
      <Reveal>
        <EditorialSections />
      </Reveal>
      <Reveal>
        <GuidesResources />
      </Reveal>
      <RecentlyViewed />
      <Reveal>
        <AskAqua />
      </Reveal>
      <Reveal>
        <TrustBand />
      </Reveal>
    </>
  )
}
