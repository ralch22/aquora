import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import MobileCheckoutBar from "../components/mobile-checkout-bar"
import Divider from "@modules/common/components/divider"
import ImageBanner from "@modules/common/components/image-banner"
import RecommendedRail from "@modules/home/components/recommended-rail"
import CartViewTracker from "@modules/analytics/cart-view-tracker"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  // Anchor the cross-sell on the most expensive cart line so /store/recommend
  // returns complementary "you may also need" items for the headline purchase.
  const contextHandle = cart?.items?.length
    ? [...cart.items]
        .sort((a, b) => (b.unit_price ?? 0) - (a.unit_price ?? 0))[0]
        ?.product_handle ?? undefined
    : undefined

  return (
    <div className="py-12 pb-28 small:pb-12">
      <div className="content-container" data-testid="cart-container">
        <div className="mb-8">
          <ImageBanner
            image="/images/brand/editorial-delivery.webp"
            imageAlt="Free, fast pool equipment delivery across the UAE"
            eyebrow="You're in good hands"
            headline="Free UAE delivery over AED 500"
            text="Genuine equipment, secure checkout and expert after-sales support."
            cta={{ label: "Keep shopping", href: "/store" }}
            variant="strip"
            align="left"
          />
        </div>
        {cart?.items?.length ? (
          <>
          <CartViewTracker
            value={(cart as any).total}
            items={(cart.items || []).map((i: any) => ({
              id: i.variant_id || i.id,
              name: i.product_title || i.title,
              price: i.unit_price,
              quantity: i.quantity,
            }))}
          />
          <div className="mb-8 border-b border-black/[0.06] pb-6">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
              Your cart
            </span>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-4xl">
              Review your equipment
            </h1>
          </div>
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col bg-white py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="bg-white py-6">
                      <Summary cart={cart} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <MobileCheckoutBar cart={cart} />
          </>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
      {/* Cart cross-sell — highest-intent moment. Anchored on the priciest line so
          /store/recommend returns complementary "you may also need" items. Renders inline
          (no streamed Suspense) and self-hides when fewer than 3 recs come back. */}
      {cart?.items?.length ? (
        <RecommendedRail
          eyebrow="You may also need"
          title="Complete your setup"
          handle={contextHandle}
        />
      ) : null}
    </div>
  )
}

export default CartTemplate
