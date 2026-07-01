"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Same step resolution the Summary uses, so the bar deep-links to the right checkout step.
function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) return "address"
  if ((cart?.shipping_methods?.length ?? 0) === 0) return "delivery"
  return "payment"
}

// Always-reachable checkout CTA on small screens, where the order summary stacks far below the
// item list. Hidden on desktop (the summary is sticky in the right column there).
export default function MobileCheckoutBar({ cart }: { cart: HttpTypes.StoreCart }) {
  const step = getCheckoutStep(cart)
  const total = (cart as any)?.total ?? 0
  const count = cart?.items?.reduce((a, i) => a + i.quantity, 0) ?? 0

  return (
    <div className="aq-bar-up fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-xl shadow-[0_-10px_30px_-16px_rgba(11,31,36,0.25)] small:hidden">
      <div className="content-container flex items-center justify-between gap-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          <span className="block text-[11px] leading-tight text-aquora-muted">
            Total · {count} {count === 1 ? "item" : "items"} (incl. taxes)
          </span>
          <span className="block font-heading text-lg font-bold leading-tight text-aquora-ink">
            {convertToLocale({ amount: total, currency_code: cart.currency_code })}
          </span>
        </div>
        <LocalizedClientLink href={"/checkout?step=" + step} className="shrink-0" data-testid="mobile-checkout-button">
          <Button className="h-11 px-6">Go to checkout</Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}
