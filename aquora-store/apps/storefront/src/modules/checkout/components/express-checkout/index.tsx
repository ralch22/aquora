"use client"

import { useState } from "react"
import {
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { placeOrder } from "@lib/data/cart"
import ErrorMessage from "@modules/checkout/components/error-message"

// Apple Pay / Google Pay one-click via Stripe's Express Checkout Element. Only the wallets
// actually available on the device + enabled on the Stripe account render (the element shows
// nothing otherwise, so we keep it hidden until onReady reports availability). Shipping and
// billing are already collected in the earlier checkout steps, so the wallet only authorizes
// the payment; on success we complete the Medusa cart (placeOrder redirects to the receipt).
//
// Requires: backend provider automaticPaymentMethods:true (PaymentIntent wallet-eligible) and,
// for Apple Pay, the live domain registered under Stripe → Settings → Payment methods.
const ExpressCheckout = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState(false)

  const onConfirm = async () => {
    if (!stripe || !elements) return
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    })

    if (confirmError) {
      // The wallet may have actually paid even if Stripe returns an error envelope —
      // complete the order in that case rather than letting a paid customer retry.
      const pi = (confirmError as { payment_intent?: { status?: string } })
        .payment_intent
      if (pi && (pi.status === "succeeded" || pi.status === "requires_capture")) {
        await placeOrder().catch((e) =>
          setError((e as Error)?.message || "Your order could not be completed.")
        )
        return
      }
      setError(confirmError.message || "Your payment could not be completed.")
      return
    }

    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "requires_capture")
    ) {
      await placeOrder().catch((e) =>
        setError((e as Error)?.message || "Your order could not be completed.")
      )
    }
  }

  // useElements/useStripe are null when not inside the Stripe <Elements> provider
  // (i.e. before a Stripe payment session exists) — render nothing in that case.
  if (!stripe || !elements) return null

  return (
    <div className={available ? "mb-2" : "hidden"}>
      <ExpressCheckoutElement
        onReady={({ availablePaymentMethods }) =>
          setAvailable(!!availablePaymentMethods)
        }
        onConfirm={onConfirm}
        options={{ paymentMethods: { applePay: "auto", googlePay: "auto" } }}
      />
      <ErrorMessage error={error} data-testid="express-checkout-error" />
      {available && (
        <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-aquora-muted">
          <span className="h-px flex-1 bg-black/10" />
          or pay another way
          <span className="h-px flex-1 bg-black/10" />
        </div>
      )}
    </div>
  )
}

export default ExpressCheckout
