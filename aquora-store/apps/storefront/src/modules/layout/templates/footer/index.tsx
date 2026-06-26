import { Text } from "@modules/common/components/ui";

import LocalizedClientLink from "@modules/common/components/localized-client-link";
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
    <footer className="w-full border-t border-black/5 bg-aquora-surface text-aquora-ink">
      <div className="content-container flex flex-col w-full">
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
