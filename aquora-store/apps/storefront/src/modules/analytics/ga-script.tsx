"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { GA_ID } from "@lib/analytics"

// GA4 loader — renders nothing (and ships no script) unless NEXT_PUBLIC_GA_ID is set.
// Manual page_view on route change (send_page_view:false) so App-Router navigations
// are tracked. anonymize_ip on; no PII anywhere.
export default function GAScript() {
  const pathname = usePathname()

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined" || typeof window.gtag !== "function") return
    window.gtag("event", "page_view", { page_path: pathname })
  }, [pathname])

  if (!GA_ID) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true,send_page_view:false});`}
      </Script>
    </>
  )
}
