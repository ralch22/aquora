import { getBaseURL } from "@lib/util/env"
import { listRegions } from "@lib/data/regions"

// Languages the storefront serves to its audience. Mirrors the `availableLanguage`
// declared in site-jsonld (en + ar for the Gulf market). Content is language-negotiated
// at a single per-country URL (no /en or /ar path segment), so every language variant of
// a page shares the same URL — hreflang still signals the targeting to search engines.
const LANGUAGES = ["en", "ar"] as const

type Alternates = {
  canonical: string
  languages: Record<string, string>
}

/**
 * Build a self-referencing canonical + hreflang/x-default alternates block for a page,
 * keyed off the configured region/country list (not hardcoded). Drop the result straight
 * into a Next `Metadata.alternates`.
 *
 * @param countryCode the current `[countryCode]` route segment (e.g. "ae")
 * @param path        the path AFTER the country code, no leading slash (e.g. "products/foo").
 *                    Pass "" for a country root page.
 */
export async function buildAlternates(
  countryCode: string,
  path: string
): Promise<Alternates> {
  const base = getBaseURL()
  const clean = path.replace(/^\/+|\/+$/g, "")
  const suffix = clean ? `/${clean}` : ""

  // Derive the set of country codes from the configured regions so hreflang scales with
  // however many regions the store runs. Fall back to the current country if the backend
  // is unreachable (e.g. at build time) so canonical/x-default still resolve correctly.
  let countryCodes: string[] = []
  try {
    const regions = await listRegions()
    countryCodes =
      regions
        ?.flatMap((r) => r.countries?.map((c) => c.iso_2) ?? [])
        .filter((c): c is string => Boolean(c)) ?? []
  } catch {
    // ignore — fall back below
  }
  if (!countryCodes.length) {
    countryCodes = [countryCode]
  }

  const languages: Record<string, string> = {}
  for (const cc of countryCodes) {
    const url = `${base}/${cc}${suffix}`
    for (const lang of LANGUAGES) {
      languages[`${lang}-${cc.toUpperCase()}`] = url
    }
  }

  // x-default points at the default region's page (stable across language variants).
  const defaultCC = countryCodes[0] ?? countryCode
  languages["x-default"] = `${base}/${defaultCC}${suffix}`

  return {
    canonical: `${base}/${countryCode}${suffix}`,
    languages,
  }
}
