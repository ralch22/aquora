import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import SiteJsonLd from "@modules/common/components/site-jsonld"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <head>
        {/* Enable scroll-reveal hiding only when JS is present (before paint, no FOUC). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('aq-js')" }} />
      </head>
      <body>
        <SiteJsonLd />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
