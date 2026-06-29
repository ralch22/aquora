// Trust + payment-method graphics — the universal e-commerce reassurance row competitors use in
// footers, carts and buy-boxes. All copy is honest: free delivery over AED 500, encrypted
// checkout, genuine/warrantied stock, local support. Payment marks are the official acceptance
// marks from the MIT-licensed `react-pay-icons` set (server-safe SVGs) — the standard, intended
// way a merchant shows the methods it accepts (cards + Apple/Google Pay via Stripe).
import { Visa, Mastercard, Amex, Applepay, Googlepay } from "react-pay-icons"

type Feature = { title: string; sub: string; icon: React.ReactNode }

const ic = "h-5 w-5"

const FEATURES: Feature[] = [
  {
    title: "Free UAE delivery",
    sub: "On orders over AED 500",
    icon: (
      <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7zM7.5 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM18 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
      </svg>
    ),
  },
  {
    title: "Secure checkout",
    sub: "Encrypted, PCI-compliant",
    icon: (
      <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
      </svg>
    ),
  },
  {
    title: "Genuine & warrantied",
    sub: "Authentic manufacturer stock",
    icon: (
      <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Expert local support",
    sub: "Specify, install & after-sales",
    icon: (
      <svg className={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 13a8 8 0 0 1 16 0M4 13v3a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zM20 13v3a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2zM12 18v2a2 2 0 0 0 2 2h2" />
      </svg>
    ),
  },
]

const MARKS: { Comp: (props: any) => any; label: string }[] = [
  { Comp: Visa, label: "Visa" },
  { Comp: Mastercard, label: "Mastercard" },
  { Comp: Amex, label: "American Express" },
  { Comp: Applepay, label: "Apple Pay" },
  { Comp: Googlepay, label: "Google Pay" },
]

export function TrustFeatures({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-x-6 gap-y-5 small:grid-cols-4 ${className}`}>
      {FEATURES.map((f) => (
        <div key={f.title} className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-aquora-primary/10 text-aquora-primary">
            {f.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight text-aquora-ink">{f.title}</span>
            <span className="block text-xs leading-snug text-aquora-muted">{f.sub}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function PaymentMethods({ className = "", tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const label = tone === "dark" ? "text-white/60" : "text-aquora-muted"
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${label}`}>
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
        </svg>
        We accept
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {MARKS.map(({ Comp, label: mLabel }) => (
          <span
            key={mLabel}
            role="img"
            aria-label={mLabel}
            className="inline-flex h-8 w-[52px] items-center justify-center rounded-md border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(11,31,36,0.05)]"
          >
            <Comp className="h-[18px] w-auto" />
          </span>
        ))}
      </div>
    </div>
  )
}

// Full strip used in the footer.
export default function PaymentTrustStrip() {
  return (
    <div className="flex flex-col gap-8 border-t border-black/5 py-10 lg:flex-row lg:items-center lg:justify-between">
      <TrustFeatures className="lg:max-w-3xl lg:flex-1" />
      <PaymentMethods className="lg:justify-end" />
    </div>
  )
}
