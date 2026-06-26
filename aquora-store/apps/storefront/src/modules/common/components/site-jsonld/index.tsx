import { brand, contact } from "@lib/aquora/brand"
import { getBaseURL } from "@lib/util/env"

// Sitewide structured data: Organization (entity/knowledge-panel) + WebSite with a
// SearchAction so Google can surface a Sitelinks search box pointing at /search.
export default function SiteJsonLd() {
  const base = getBaseURL()

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: base,
    logo: `${base}/favicon.ico`,
    description: brand.positioning,
    email: contact.email,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dubai Investment Park",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    areaServed: "United Arab Emirates",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: contact.email,
      telephone: contact.phone,
      areaServed: "AE",
      availableLanguage: ["en", "ar"],
    },
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/ae/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, website]) }}
    />
  )
}
