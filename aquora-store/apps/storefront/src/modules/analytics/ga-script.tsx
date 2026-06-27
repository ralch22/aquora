"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { GA_ID, GTM_ID } from "@lib/analytics"

// Loads GTM when NEXT_PUBLIC_GTM_ID is set (preferred — GA4 + server-side live in the
// container); otherwise falls back to direct GA4 when NEXT_PUBLIC_GA_ID is set. They are
// mutually exclusive so GA4 is never double-counted. Renders nothing when neither is set.
export default function GAScript() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined" || (!GTM_ID && !GA_ID)) return
    const dl = (window.dataLayer = window.dataLayer || [])
    if (GTM_ID) {
      dl.push({ event: "page_view", page_path: pathname } as any)
    } else {
      // gtag-format command, queues until gtag.js loads
      ;(dl as unknown[]).push(["event", "page_view", { page_path: pathname }])
    }
  }, [pathname])

  if (GTM_ID) {
    return (
      <>
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
      </>
    )
  }

  if (GA_ID) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true,send_page_view:false});`}
        </Script>
      </>
    )
  }

  return null
}
