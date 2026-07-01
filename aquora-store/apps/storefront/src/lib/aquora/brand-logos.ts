// Official brand logos for the brands Aquora genuinely stocks (nominative use). Each was
// sourced from the brand's own site and lives in /public/brand-logos. They are rendered
// GRAYSCALE via CSS (a non-destructive display filter) and revealed to full colour on hover,
// so the genuine mark and brand colours are preserved. A brand with no entry here falls back
// to a clean text wordmark — nothing is fabricated. Keyed by the exact brand name in brands.ts.
export const brandLogos: Record<string, string> = {
  Pentair: "/brand-logos/pentair.svg",
  AstralPool: "/brand-logos/astralpool.svg",
  Zodiac: "/brand-logos/zodiac.svg",
  Speck: "/brand-logos/speck.svg",
  Dolphin: "/brand-logos/dolphin.svg",
  Behncke: "/brand-logos/behncke.png",
  Cepex: "/brand-logos/cepex.png",
  DAB: "/brand-logos/dab.svg",
  Polaris: "/brand-logos/polaris.png",
  Elecro: "/brand-logos/elecro.svg",
  Atecpool: "/brand-logos/atecpool.png",
}

export function brandLogo(name: string): string | undefined {
  return brandLogos[name]
}
