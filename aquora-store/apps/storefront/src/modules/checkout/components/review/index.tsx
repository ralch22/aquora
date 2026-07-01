"use client"

import { Heading, Text, clx } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <div className="aq-step-in">
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-aquora-ink mb-1">
                By placing your order you agree to Aquora&apos;s{" "}
                <LocalizedClientLink href="/legal/terms" className="text-aquora-primary underline">
                  Terms
                </LocalizedClientLink>{" "}
                &amp;{" "}
                <LocalizedClientLink href="/legal/returns" className="text-aquora-primary underline">
                  Returns Policy
                </LocalizedClientLink>
                , and acknowledge our{" "}
                <LocalizedClientLink href="/legal/privacy" className="text-aquora-primary underline">
                  Privacy Policy
                </LocalizedClientLink>
                .
              </Text>
            </div>
          </div>
          {cart.email && (
            <p className="mb-4 flex items-center gap-2 text-sm text-aquora-muted">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-aquora-primary" aria-hidden>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              We&apos;ll email your order confirmation to{" "}
              <span className="font-medium text-aquora-ink">{cart.email}</span>.
            </p>
          )}
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
    </div>
  )
}

export default Review
