import type { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"

// Audience languages declared sitewide (mirrors site-jsonld's availableLanguage en/ar).
// Used only as a fallback when the backend /store/locales endpoint isn't configured.
const FALLBACK_LANGUAGES = ["en", "ar"]

/**
 * Build a self-referencing canonical plus hreflang/x-default alternates for a page.
 *
 * The store serves a single region (UAE) to en+ar audiences and the language is
 * negotiated at request time — there is no language segment in the path — so every
 * (language, country) hreflang for a given country points at the same localized path.
 * Country codes are derived from the configured regions (not hardcoded) so adding a
 * region in the backend automatically widens the alternates; content languages come
 * from the real /store/locales list when configured, otherwise the en/ar audience.
 *
 * @param path        Path AFTER the country segment, with a leading slash
 *                    (e.g. "/products/eco-pump"); "" maps to the region home.
 * @param countryCode The current request's country segment (e.g. "ae").
 */
export async function buildAlternates(
  path: string,
  countryCode: string
): Promise<NonNullable<Metadata["alternates"]>> {
  const base = getBaseURL()
  const clean = path && !path.startsWith("/") ? `/${path}` : path
  const url = (cc: string) => `${base}/${cc}${clean}`

  // Country codes from the configured regions; fall back to the current request's code.
  let countries: string[] = []
  try {
    const regions = await listRegions()
    countries = Array.from(
      new Set(
        ((regions ?? []).flatMap((r) =>
          (r.countries ?? []).map((c) => c.iso_2)
        ) as (string | undefined)[]).filter(Boolean) as string[]
      )
    )
  } catch {
    // listRegions can throw at build time when the backend is unreachable.
  }
  if (!countries.length) countries = [countryCode]

  // Content languages: the real configured locales when available, else the en/ar audience.
  let languages = FALLBACK_LANGUAGES
  try {
    const locales = await listLocales()
    if (locales?.length) {
      languages = locales.map((l) => l.code).filter(Boolean)
    }
  } catch {
    // Endpoint may 404 when locales aren't configured.
  }
  if (!languages.length) languages = FALLBACK_LANGUAGES

  const languageMap: Record<string, string> = {}
  for (const cc of countries) {
    for (const lang of languages) {
      // hreflang in `lang-COUNTRY` form (e.g. en-AE). If a locale already carries a
      // region tag, use it verbatim and don't append the country again.
      const key = lang.includes("-") ? lang : `${lang}-${cc.toUpperCase()}`
      languageMap[key] = url(cc)
    }
  }
  // x-default → the current region when it's one of the configured ones, else the first.
  const defaultCc = countries.includes(countryCode) ? countryCode : countries[0]
  languageMap["x-default"] = url(defaultCc)

  return {
    canonical: url(countryCode),
    languages: languageMap,
  }
}
