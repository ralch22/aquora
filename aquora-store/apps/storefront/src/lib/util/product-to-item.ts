import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "./get-product-price"

// Map a catalog product to the minimal GA4 item shape used by view_item_list /
// select_item. Only real fields already on the product object — id, title and the
// computed cheapest price (omitted when no price is resolvable). Never fabricated.
export function productToItem(product: HttpTypes.StoreProduct) {
  let price: number | undefined
  try {
    price = getProductPrice({ product }).cheapestPrice?.calculated_price_number
  } catch {
    price = undefined
  }
  return {
    id: product.id,
    name: product.title,
    ...(price != null ? { price } : {}),
  }
}
