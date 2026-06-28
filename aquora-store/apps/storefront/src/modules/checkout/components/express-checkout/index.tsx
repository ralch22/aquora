"use client"

import { useState } from "react"
import {
  Elements,
  ExpressCheckoutElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { HttpTypes } from "@medusajs/types"
import { initiatePaymentSession, placeOrder } from "@lib/data/cart"
import ErrorMessage from "@modules/checkout/components/error-message"

// Apple Pay / Google Pay one-click via Stripe's Express Checkout Element.
//
// SAFETY (why this can't white-screen checkout again): this component mounts its OWN
// isolated <Elements> provider in DEFERRED mode, completely independent of the card path's
// PaymentWrapper/<Elements>. So `useStripe()` always has an <Elements> ancestor here, and a
// failure in the wallet flow can only ever affect THIS widget — never the card form or the
// rest of checkout. (A previous version called useStripe() with no <Elements> ancestor on
// every step and crashed all of checkout; isolation makes that impossible.)
//
// Flow: render wallet buttons from amount+currency (deferred) → on tap, create the Medusa
// Stripe PaymentIntent (initiatePaymentSession) → confirm against its client_secret →
// placeOrder() completes the Medusa cart (redirects to the receipt). Shipping/billing are
// already collected in the earlier steps, so the wallet only authorizes payment.
//
// Requirements (both already in place): backend provider automaticPaymentMethods:true, and
// for Apple Pay the live domain registered under Stripe → Settings → Payment methods.

const STRIPE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null

const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

function ExpressInner({ cart }: { cart: HttpTypes.StoreCart }) {
  const stripe = useStripe()
  const elements = useElements()
  const [available, setAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const succeeded = (pi?: { status?: string } | null) =>
    pi?.status === "succeeded" || pi?.status === "requires_capture"

  const onConfirm = async () => {
    if (!stripe || !elements) return
    setError(null)

    // 1. Validate the wallet element before touching the server.
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || "Your payment could not be started.")
      return
    }

    // 2. Create the Medusa Stripe PaymentIntent and read its client secret.
    let clientSecret: string | undefined
    try {
      const resp = (await initiatePaymentSession(cart, {
        provider_id: STRIPE_PROVIDER_ID,
      } as HttpTypes.StoreInitializePaymentSession)) as any
      const sessions =
        resp?.cart?.payment_collection?.payment_sessions ||
        resp?.payment_collection?.payment_sessions ||
        cart?.payment_collection?.payment_sessions ||
        []
      const session = sessions.find(
        (s: any) =>
          s.provider_id === STRIPE_PROVIDER_ID &&
          (s.status === "pending" || s.status === "authorized")
      )
      clientSecret = session?.data?.client_secret as string | undefined
    } catch (e) {
      setError((e as Error)?.message || "Your payment could not be started.")
      return
    }
    if (!clientSecret) {
      setError(
        "Your payment could not be started. Please use the card form below."
      )
      return
    }

    // 3. Confirm the wallet payment against that PaymentIntent.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    })

    if (confirmError) {
      // The wallet may have actually paid even if Stripe returns an error envelope —
      // complete the order in that case rather than letting a paid customer retry.
      const pi = (confirmError as { payment_intent?: { status?: string } })
        .payment_intent
      if (succeeded(pi)) {
        await placeOrder().catch((e) =>
          setError((e as Error)?.message || "Your order could not be completed.")
        )
        return
      }
      setError(confirmError.message || "Your payment could not be completed.")
      return
    }

    if (succeeded(paymentIntent)) {
      await placeOrder().catch((e) =>
        setError((e as Error)?.message || "Your order could not be completed.")
      )
    }
  }

  // The element renders nothing until a wallet is actually available on the device, so keep
  // the whole block hidden (and the "or pay with card" divider out) until onReady confirms.
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
          or pay with card
          <span className="h-px flex-1 bg-black/10" />
        </div>
      )}
    </div>
  )
}

export default function ExpressCheckout({
  cart,
}: {
  cart: HttpTypes.StoreCart
}) {
  const amount = Math.round(((cart?.total as number) || 0) * 100)
  // No key, or below Stripe's ~2 AED minimum → render nothing (never crash).
  if (!stripePromise || amount < 200) return null

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount,
        currency: (cart?.currency_code || "aed").toLowerCase(),
        appearance: { variables: { borderRadius: "10px" } },
      }}
    >
      <ExpressInner cart={cart} />
    </Elements>
  )
}
