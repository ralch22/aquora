import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import AiAssistant from "@modules/layout/components/ai-assistant"
import CompareBar from "@modules/layout/components/compare-bar"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import { Toaster } from "@modules/common/components/toast"
import CookieConsent from "@modules/analytics/cookie-consent"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  // Parallel — cart doesn't depend on customer; saves a round-trip on every page's TTFB.
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <>
      <Nav />
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}

      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {props.children}
      <Footer />
      <AiAssistant
        cartItems={
          cart?.items?.map((i: any) => ({
            title: i.product_title || i.title,
            variant_id: i.variant_id,
            handle: i.product?.handle,
          })) || []
        }
      />
      <CompareBar />
      <Toaster />
      <CookieConsent />
    </>
  )
}
