import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { Toaster } from "@modules/common/components/toast"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-aquora-surface/30 relative small:min-h-screen">
      <div className="sticky top-0 z-30 h-16 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="flex flex-1 basis-0 items-center gap-x-2 text-sm font-medium text-aquora-muted transition-colors hover:text-aquora-primary"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden small:block">Back to shopping cart</span>
            <span className="mt-px block small:hidden">Back</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="font-heading text-xl font-extrabold tracking-tight text-aquora-ink"
            data-testid="store-link"
          >
            AQU<span className="text-aquora-primary">O</span>RA
          </LocalizedClientLink>
          <div className="flex flex-1 basis-0 items-center justify-end gap-1.5 text-xs font-medium text-aquora-muted">
            <svg className="h-4 w-4 text-aquora-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M8 1.5l5 2v3.5c0 3.2-2.1 5.3-5 6.5-2.9-1.2-5-3.3-5-6.5V3.5l5-2Z" strokeLinejoin="round" />
              <path d="M6 8l1.5 1.5L10.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden small:inline">Secure checkout</span>
          </div>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <div className="py-6 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
      <Toaster />
    </div>
  )
}
