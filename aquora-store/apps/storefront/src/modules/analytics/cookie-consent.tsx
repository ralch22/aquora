"use client"

import { useEffect, useState } from "react"
import { GA_ID, GTM_ID } from "@lib/analytics"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const COOKIE = "aq_consent"

// Persists the choice and updates Google Consent Mode. Works whether or not gtag.js has
// loaded yet (falls back to pushing the consent command straight onto the dataLayer).
function setConsent(v: "granted" | "denied") {
  document.cookie = `${COOKIE}=${v};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
  const w = window as any
  w.dataLayer = w.dataLayer || []
  const push = w.gtag || function () { w.dataLayer.push(arguments) }
  push("consent", "update", {
    ad_storage: v,
    analytics_storage: v,
    ad_user_data: v,
    ad_personalization: v,
  })
}

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!GA_ID && !GTM_ID) return
    if (!document.cookie.includes(`${COOKIE}=`)) setShow(true)
  }, [])

  if (!show) return null

  const choose = (v: "granted" | "denied") => {
    setConsent(v)
    setShow(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 small:px-6 small:pb-6">
      <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-black/10 bg-white/90 p-5 shadow-[0_20px_60px_-20px_rgba(11,31,36,0.35)] backdrop-blur-xl small:flex small:items-center small:gap-6 small:p-6">
        <p className="text-sm leading-relaxed text-aquora-ink">
          We use essential cookies to run the store and, with your consent, analytics cookies to
          improve it. See our{" "}
          <LocalizedClientLink href="/legal/cookies" className="font-semibold text-aquora-primary hover:underline">
            Cookie Policy
          </LocalizedClientLink>
          .
        </p>
        <div className="mt-4 flex shrink-0 gap-3 small:mt-0">
          <button
            onClick={() => choose("denied")}
            className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold text-aquora-ink transition-colors hover:bg-black/5"
          >
            Decline
          </button>
          <button
            onClick={() => choose("granted")}
            className="rounded-full bg-aquora-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] hover:bg-aquora-secondary"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
