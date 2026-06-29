import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

// A minimal, serializable product shape for GA4 list events. `handle` lets the client
// tracker map a clicked PDP link back to the originating item. Real catalogue data only —
// id/name/price are read straight off the product; nothing is fabricated.
export type ListItem = {
  handle: string
  id: string
  name: string
  price?: number
  category?: string
}

export function toListItems(products: HttpTypes.StoreProduct[]): ListItem[] {
  return (products || [])
    .filter((p) => p && p.id)
    .map((p) => {
      const { cheapestPrice } = getProductPrice({ product: p })
      return {
        handle: p.handle,
        id: p.id,
        name: p.title,
        price: cheapestPrice?.calculated_price_number,
        category: (p as any).categories?.[0]?.name,
      }
    })
}
