"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  // Never throw from here — this component wraps the whole checkout step, so a missing key
  // or client_secret used to white-screen the entire page (useStripe() throws with no
  // <Elements> ancestor). Instead always mount <Elements> (stripe may be null → it stays
  // inert, useStripe() returns null, and StripePaymentButton disables itself + guards on
  // !stripe). When the key IS present (normal prod), this behaves exactly as before.
  const clientSecret = paymentSession?.data?.client_secret as string | undefined
  const options: StripeElementsOptions | undefined = clientSecret
    ? { clientSecret }
    : undefined

  return (
    <StripeContext.Provider value={!!stripePromise}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper
