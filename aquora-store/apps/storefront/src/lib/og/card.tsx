import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { brand } from "@lib/aquora/brand"

// Shared Open Graph card renderer. Every opengraph-image.tsx / twitter-image.tsx route
// funnels through here so shared links (WhatsApp, iMessage, LinkedIn, X, Slack…) all get
// the same branded 1200×630 card: deep-teal field, the Aquora ring mark + wordmark, and a
// per-page title. Replaces the Medusa starter-template JPEGs that used to leak on shares.
//
// Fonts: subsetted Sora TTFs (OFL) committed next to this file. The storefront container
// runs `next start` over the full source tree (see Dockerfile), so a runtime fs read of a
// src/ asset is safe — the blog markdown lib relies on the same property.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

const TEAL = brand.palette.primary // #0E6E73
const DARK = brand.palette.secondary // #0A3A42
const GOLD = brand.palette.accent // #E0A23B
const SURFACE = brand.palette.surface // #F4F8F8

let fontsPromise: Promise<{ semibold: Buffer; extrabold: Buffer }> | null = null

function loadFonts() {
  if (!fontsPromise) {
    const dir = join(process.cwd(), "src/lib/og")
    fontsPromise = Promise.all([
      readFile(join(dir, "sora-semibold.ttf")),
      readFile(join(dir, "sora-extrabold.ttf")),
    ]).then(([semibold, extrabold]) => ({ semibold, extrabold }))
  }
  return fontsPromise
}

// The ring + meniscus mark from public/logo.svg, reversed to white for the dark card.
function RingMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
    >
      <g stroke={SURFACE} fill="none" strokeLinecap="round">
        <circle cx="70" cy="70" r="40" strokeWidth="12" />
        <path d="M37 93 A40 40 0 0 0 103 93" strokeWidth="18" />
      </g>
    </svg>
  )
}

export type OgCardProps = {
  /** Main line, e.g. a category / guide / article name. Keep under ~70 chars. */
  title: string
  /** Small line under the title. Defaults to the brand positioning line. */
  subtitle?: string
  /** Tiny uppercase kicker above the title, e.g. "Buying guide". */
  eyebrow?: string
}

/** Render the branded OG card. Await this from an opengraph-image route and return it. */
export async function renderOgCard({ title, subtitle, eyebrow }: OgCardProps) {
  const { semibold, extrabold } = await loadFonts()
  const displayTitle = title.length > 90 ? `${title.slice(0, 87)}…` : title
  const titleSize = displayTitle.length > 55 ? 52 : displayTitle.length > 34 ? 62 : 74

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: `linear-gradient(135deg, ${TEAL} 0%, ${DARK} 78%)`,
          fontFamily: "Sora",
          position: "relative",
        }}
      >
        {/* Oversized watermark ring bleeding off the right edge */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            right: -160,
            top: -40,
            opacity: 0.1,
          }}
        >
          <RingMark size={560} />
        </div>

        {/* Header: mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <RingMark size={76} />
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: 5,
              color: SURFACE,
            }}
          >
            AQUORA
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: 18,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 800,
              lineHeight: 1.12,
              color: SURFACE,
            }}
          >
            {displayTitle}
          </div>
          {subtitle ? (
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                lineHeight: 1.35,
                color: "rgba(244,248,248,0.82)",
                marginTop: 22,
                maxWidth: 900,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        {/* Footer: gold rule + domain */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", width: 64, height: 6, background: GOLD, borderRadius: 3 }} />
          <div style={{ fontSize: 27, fontWeight: 600, color: "rgba(244,248,248,0.9)", letterSpacing: 1 }}>
            aquora.ae
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Sora", data: semibold, weight: 600, style: "normal" },
        { name: "Sora", data: extrabold, weight: 800, style: "normal" },
      ],
    }
  )
}

/** The site-wide default card (used by the root fallback routes). */
export function renderDefaultOgCard() {
  return renderOgCard({
    title: "Pool, Spa & Fountain Equipment",
    subtitle:
      "Genuinely engineered equipment, stocked and supported across the UAE & GCC.",
    eyebrow: brand.tagline,
  })
}
