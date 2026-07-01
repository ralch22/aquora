import { brand, contact, hasRealPhone } from "@lib/aquora/brand"
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
    logo: `${base}/logo.svg`,
    description: brand.positioning,
    email: contact.email,
    ...(hasRealPhone ? { telephone: contact.phone } : {}),
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
      ...(hasRealPhone ? { telephone: contact.phone } : {}),
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

  // LocalBusiness (Store) node — powers the local/knowledge surfaces. Address + hours come from
  // brand.ts; telephone stays gated on hasRealPhone so the all-zeros placeholder never renders,
  // and geo is deliberately omitted (no confirmed coordinates — never fabricate a map pin).
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${base}/#store`,
    name: brand.name,
    url: base,
    image: `${base}/logo.svg`,
    logo: `${base}/logo.svg`,
    description: brand.positioning,
    email: contact.email,
    ...(hasRealPhone ? { telephone: contact.phone } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dubai Investment Park",
      addressLocality: "Dubai",
      addressCountry: "AE",
    },
    areaServed: "United Arab Emirates",
    priceRange: "$$",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "08:00",
      closes: "18:00",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([organization, website, localBusiness]) }}
    />
  )
}
