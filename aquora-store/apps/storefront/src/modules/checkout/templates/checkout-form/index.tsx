import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import SectionShell from "@modules/common/components/section-shell"
import BeginCheckoutTracker from "@modules/analytics/begin-checkout-tracker"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  const items = (cart.items || []).map((i: any) => ({
    id: i.variant_id || i.id,
    name: i.product_title || i.title,
    price: i.unit_price,
    quantity: i.quantity,
  }))

  return (
    <div className="grid w-full grid-cols-1 gap-y-6">
      <BeginCheckoutTracker value={(cart as any).total} items={items} />
      <SectionShell>
        <Addresses cart={cart} customer={customer} />
      </SectionShell>
      <SectionShell>
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      </SectionShell>
      <SectionShell>
        <Payment cart={cart} availablePaymentMethods={paymentMethods} />
      </SectionShell>
      <SectionShell>
        <Review cart={cart} />
      </SectionShell>
    </div>
  )
}
