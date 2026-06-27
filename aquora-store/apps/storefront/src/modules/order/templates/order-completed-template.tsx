import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import SectionShell from "@modules/common/components/section-shell"
import PremiumCta from "@modules/common/components/premium-cta"
import PurchaseTracker from "@modules/analytics/purchase-tracker"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  const items = (order.items || []).map((i: any) => ({
    id: i.variant_id || i.id,
    name: i.product_title || i.title,
    price: i.unit_price,
    quantity: i.quantity,
  }))

  return (
    <div className="py-12 min-h-[calc(100vh-64px)]">
      <PurchaseTracker id={order.id} value={(order as any).total} items={items} />
      <div className="content-container flex w-full max-w-4xl flex-col gap-y-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        {/* Premium confirmation header */}
        <div className="text-center" data-testid="order-complete-container">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] border border-black/[0.06] bg-white shadow-[0_22px_44px_-26px_rgba(11,31,36,0.28)]">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-aquora-primary text-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12.5l5 5 11-11" />
              </svg>
            </span>
          </span>
          <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            Order confirmed
          </span>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-4xl">
            Thank you — your order is placed.
          </h1>
          <p className="mt-3 text-aquora-muted">
            We&apos;ve received your order and our team will be in touch to confirm
            delivery across the UAE.
          </p>
        </div>

        <SectionShell>
          <OrderDetails order={order} />
          <h2 className="mt-6 font-heading text-xl font-bold tracking-tight text-aquora-ink">Summary</h2>
          <div className="mt-4">
            <Items order={order} />
            <CartTotals totals={order} />
          </div>
          <div className="mt-8 grid gap-8 small:grid-cols-2">
            <ShippingDetails order={order} />
            <PaymentDetails order={order} />
          </div>
          <Help />
        </SectionShell>

        <div className="flex justify-center">
          <PremiumCta href="/store" variant="primary">
            Continue shopping
          </PremiumCta>
        </div>
      </div>
    </div>
  )
}
