import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

// Free UAE delivery over AED 500 is promised in the announcement bar; reinforce it
// where it converts (cart) with a progress nudge toward the threshold.
const THRESHOLD = 500

export default function FreeDeliveryProgress({ cart }: { cart: HttpTypes.StoreCart }) {
  const currency = (cart?.currency_code || "").toLowerCase()
  if (currency !== "aed") return null

  const subtotal = (cart?.item_subtotal ?? 0) as number
  const remaining = Math.max(0, THRESHOLD - subtotal)
  const pct = subtotal <= 0 ? 0 : Math.max(4, Math.min(100, Math.round((subtotal / THRESHOLD) * 100)))
  const qualified = remaining <= 0

  return (
    <div className="rounded-large border border-aquora-primary/15 bg-aquora-primary/5 p-4">
      <p className="text-sm text-aquora-ink mb-2.5 flex items-start gap-2">
        {qualified ? (
          <>
            <span aria-hidden className="text-aquora-primary">✓</span>
            <span className="font-semibold text-aquora-primary">Your order qualifies for free UAE delivery.</span>
          </>
        ) : (
          <span>
            Add{" "}
            <span className="font-semibold text-aquora-ink">
              {convertToLocale({ amount: remaining, currency_code: "aed" })}
            </span>{" "}
            more for <span className="font-semibold text-aquora-primary">free UAE delivery</span>.
          </span>
        )}
      </p>
      <div className="h-2 w-full rounded-full bg-aquora-primary/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-aquora-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
