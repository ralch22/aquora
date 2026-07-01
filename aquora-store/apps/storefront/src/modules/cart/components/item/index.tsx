"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { trackRemoveFromCart } from "@lib/analytics"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useEffect, useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Optimistic quantity: the <select> reflects the choice INSTANTLY instead of snapping
  // back to the old value until the server round-trip + revalidation lands. Cleared once
  // the reconciled item.quantity arrives, or reverted on error.
  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)
  // Optimistic removal: the row fades/collapses the instant Delete is tapped (mirroring
  // the optimistic-qty pattern) rather than waiting for the server round-trip + revalidation.
  // Successful deletes unmount the row via revalidation; a failed delete reverts this flag
  // and DeleteButton surfaces its existing rose error message.
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    setOptimisticQty(null)
  }, [item.quantity])

  // Real line snapshot for GA4 remove_from_cart (no fabricated values).
  const removedItem = (qty: number) => ({
    id: item.variant_id || item.product_id || item.id,
    name: item.product_title || item.title || "",
    price: item.unit_price ?? undefined,
    quantity: qty,
  })

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setOptimisticQty(quantity)
    setUpdating(true)

    // A decrement removes (item.quantity - quantity) units → remove_from_cart for the delta.
    if (quantity < item.quantity) {
      trackRemoveFromCart(removedItem(item.quantity - quantity))
    }

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
        setOptimisticQty(null)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // Real inventory-aware cap: unmanaged/backorder variants get a sane cap; managed
  // variants are capped at remaining stock. Never below the current quantity.
  const CAP = 99
  const v = item.variant as
    | { manage_inventory?: boolean; allow_backorder?: boolean; inventory_quantity?: number }
    | undefined
  const inStock =
    !v?.manage_inventory || v?.allow_backorder
      ? CAP
      : Math.max(0, v?.inventory_quantity ?? 0)
  const maxQuantity = Math.max(item.quantity, Math.min(inStock, CAP))

  return (
    <Table.Row
      className={clx(
        "w-full aq-row-in transition-all duration-300 ease-out",
        removing && "opacity-0 -translate-y-1 pointer-events-none"
      )}
      data-testid="product-row"
    >
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-aquora-ink"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
        {type === "full" &&
          (() => {
            // Honest, real-inventory stock signal per line (never fabricated).
            const tracked = !!(v?.manage_inventory && !v?.allow_backorder)
            const qty = v?.inventory_quantity ?? 0
            const low = tracked && qty > 0 && qty <= 5
            const stocked = tracked && qty > 0 && !low
            const label = low
              ? `Only ${qty} left`
              : stocked
              ? "In stock"
              : "Available to order"
            const tone = stocked
              ? "text-emerald-700 bg-emerald-50"
              : "text-aquora-accentdark bg-aquora-accent/10"
            const dot = stocked ? "bg-emerald-500" : "bg-aquora-accent"
            return (
              <span
                className={clx(
                  "mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  tone
                )}
              >
                <span className={clx("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
                {label}
              </span>
            )
          })()}
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center w-28">
            <DeleteButton
              id={item.id}
              onRemoving={() => {
                // Full line removal → remove_from_cart for the whole quantity.
                trackRemoveFromCart(removedItem(item.quantity))
                setRemoving(true)
              }}
              onRemoveError={() => setRemoving(false)}
              data-testid="product-delete-button"
            />
            <CartItemSelect
              value={optimisticQty ?? item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-4"
              data-testid="product-select-button"
            >
              {Array.from({ length: maxQuantity }, (_, i) => (
                <option value={i + 1} key={i}>
                  {i + 1}
                </option>
              ))}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-aquora-muted">{item.quantity}x </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
