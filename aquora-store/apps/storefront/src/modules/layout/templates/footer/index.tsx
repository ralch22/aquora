import { Text } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";
import PremiumCta from "@modules/common/components/premium-cta"
import { brand, contact } from "@lib/aquora/brand"
import { categories } from "@lib/aquora/categories"

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
]

const supportLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Delivery & Returns", href: "/faq" },
  { label: "Warranty & Spares", href: "/faq" },
]

export default async function Footer() {
  const year = new Date().getFullYear()
  const blurb =
    "The Gulf's premium source for pool, spa, pond and fountain equipment — engineered house product lines paired with local expertise to specify, deliver and support them."

  return (
    <footer className="w-full bg-aquora-surface text-aquora-ink">
      {/* Pre-footer conversion band */}
      <div className="relative overflow-hidden bg-gradient-to-br from-aquora-secondary to-aquora-primary text-white">
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 text-white/[0.06]" preserveAspectRatio="none" viewBox="0 0 1440 260" fill="none">
          <path d="M0 180 C 320 120 640 220 960 170 S 1280 120 1440 170" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 220 C 320 160 640 260 960 210 S 1280 160 1440 210" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="content-container relative flex flex-col items-start gap-8 py-16 small:flex-row small:items-center small:justify-between small:py-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
              Specified · delivered · supported
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold leading-tight tracking-tight small:text-[2.5rem] small:leading-[1.08]">
              Building or upgrading a pool? Let&apos;s spec it right.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Tell us about your project. Our technical team sizes the pumps, filtration and heating, then gets genuine equipment to your site anywhere in the UAE.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <PremiumCta href="/contact" variant="accent">
              Request a quote
            </PremiumCta>
            <PremiumCta href="/services" variant="ghost">
              Our services
            </PremiumCta>
          </div>
        </div>
      </div>

      <div className="content-container flex flex-col w-full border-t border-black/5">
        {/* Brand row */}
        <div className="grid grid-cols-1 gap-y-8 medium:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] medium:gap-x-20 pt-16 pb-12 small:pt-20">
          <div className="flex flex-col gap-y-4 max-w-sm">
            <LocalizedClientLink
              href="/"
              className="font-heading text-2xl font-semibold tracking-tight text-aquora-secondary hover:text-aquora-primary transition-colors uppercase"
            >
              {brand.name}
            </LocalizedClientLink>
            <p className="font-heading text-sm font-medium text-aquora-primary">
              {brand.tagline}
            </p>
            <p className="text-sm leading-relaxed text-aquora-muted">{blurb}</p>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 small:grid-cols-4">
            {/* Shop */}
            <div className="flex flex-col gap-y-3">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider text-aquora-ink">
                Shop
              </span>
              <ul className="flex flex-col gap-y-2 text-sm text-aquora-muted">
                {categories.slice(0, 8).map((c) => (
                  <li key={c.handle}>
                    <LocalizedClientLink
                      href={`/categories/${c.handle}`}
                      className="hover:text-aquora-primary transition-colors"
                    >
                      {c.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-y-3">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider text-aquora-ink">
                Company
              </span>
              <ul className="flex flex-col gap-y-2 text-sm text-aquora-muted">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <LocalizedClientLink
                      href={link.href}
                      className="hover:text-aquora-primary transition-colors"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="flex flex-col gap-y-3">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider text-aquora-ink">
                Support
              </span>
              <ul className="flex flex-col gap-y-2 text-sm text-aquora-muted">
                {supportLinks.map((link) => (
                  <li key={link.label}>
                    <LocalizedClientLink
                      href={link.href}
                      className="hover:text-aquora-primary transition-colors"
                    >
                      {link.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-y-3">
              <span className="font-heading text-xs font-semibold uppercase tracking-wider text-aquora-ink">
                Contact
              </span>
              <ul className="flex flex-col gap-y-2 text-sm text-aquora-muted">
                <li>
                  <a
                    href={`mailto:${contact.email}`}
                    className="hover:text-aquora-primary transition-colors"
                  >
                    {contact.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className="hover:text-aquora-primary transition-colors"
                  >
                    {contact.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-aquora-primary transition-colors"
                  >
                    WhatsApp {contact.whatsapp}
                  </a>
                </li>
                <li className="pt-1 leading-relaxed">{contact.address}</li>
                <li className="text-aquora-ink/70">{contact.hours}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-y-2 small:flex-row small:items-center small:justify-between border-t border-black/5 py-6">
          <Text className="text-xs text-aquora-muted">
            © {year} {brand.name}. All rights reserved.
          </Text>
          <Text className="text-xs text-aquora-muted">
            Pool, Spa &amp; Fountain Equipment · Dubai, UAE
          </Text>
        </div>
      </div>
    </footer>
  )
}
