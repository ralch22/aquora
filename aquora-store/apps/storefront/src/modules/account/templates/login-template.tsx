"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const TRUST = [
  "5,000+ genuine, engineered products in stock",
  "48-hr delivery across the UAE & GCC",
  "Expert design, installation & after-sales support",
]

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-aquora-secondary to-aquora-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 text-white/[0.06]" preserveAspectRatio="none" viewBox="0 0 600 300" fill="none">
          <path d="M0 200 Q 150 150 300 200 T 600 200" stroke="currentColor" strokeWidth="1.5" />
          <path d="M0 240 Q 150 190 300 240 T 600 240" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="relative font-heading text-2xl font-extrabold tracking-tight">
          AQU<span className="text-aquora-accent">O</span>RA
        </span>
        <div className="relative">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Pool · spa · pond · fountain
          </span>
          <h2 className="mt-4 max-w-md font-heading text-4xl font-bold leading-[1.1] tracking-tight">
            Your account for engineered water.
          </h2>
          <ul className="mt-8 space-y-3">
            {TRUST.map((t) => (
              <li key={t} className="flex items-start gap-3 text-white/80">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-aquora-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8.5l3 3 7-7.5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">Specified, delivered and supported across the UAE & the GCC.</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-6 py-12 small:px-10">
        <div className="w-full max-w-sm">
          {currentView === "sign-in" ? (
            <Login setCurrentView={setCurrentView} />
          ) : (
            <Register setCurrentView={setCurrentView} />
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
