import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageBanner from "@modules/common/components/image-banner"

export const metadata: Metadata = {
  title: "Page not found | Aquora",
  description: "The page you were looking for doesn't exist — but we'll help you find what you need.",
}

const LINKS = [
  { label: "Shop all products", href: "/store" },
  { label: "Pool Care tools", href: "/pool-care" },
  { label: "How-to & buying guides", href: "/guides" },
  { label: "Contact our team", href: "/contact" },
]

export default function NotFound() {
  return (
    <div className="content-container py-14 small:py-20">
      <ImageBanner
        image="/images/brand/hero-bg.webp"
        imageAlt="Aquora — premium pool, spa and fountain equipment"
        eyebrow="Page not found"
        headline="Let's get you back to the water"
        text="The page you were after doesn't exist — but our full range, free tools and expert team are right here."
        cta={{ label: "Shop the store", href: "/store" }}
        secondaryCta={{ label: "Ask Pool Care", href: "/pool-care" }}
        variant="category"
        align="left"
      />
      <div className="mx-auto mt-10 max-w-2xl">
        <p className="text-center text-sm text-aquora-muted">Or jump straight to:</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {LINKS.map((l) => (
            <LocalizedClientLink
              key={l.href}
              href={l.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-aquora-ink transition hover:border-aquora-primary hover:text-aquora-primary"
            >
              {l.label}
            </LocalizedClientLink>
          ))}
        </div>
      </div>
    </div>
  )
}
