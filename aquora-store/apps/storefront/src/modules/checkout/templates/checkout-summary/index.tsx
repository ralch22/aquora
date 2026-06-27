import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import FreeDeliveryProgress from "@modules/cart/components/free-delivery"
import CheckoutAssurance from "@modules/checkout/components/assurance"
import SectionShell from "@modules/common/components/section-shell"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <div className="sticky top-24 flex flex-col-reverse gap-y-6 py-8 small:flex-col small:py-0">
      <SectionShell>
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Order summary
        </span>
        <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-aquora-ink">In your cart</h2>

        <Divider className="my-5" />
        <CartTotals totals={cart} />
        <div className="my-4">
          <FreeDeliveryProgress cart={cart} />
        </div>
        <ItemsPreviewTemplate cart={cart} />
        <div className="my-6">
          <DiscountCode cart={cart} />
        </div>
        <CheckoutAssurance />
      </SectionShell>
    </div>
  )
}

export default CheckoutSummary
