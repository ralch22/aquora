"use client"

import { addToCart } from "@lib/data/cart"
import { trackAddToCart, trackViewItem } from "@lib/analytics"
import { trackRetailEvent, recordRecentlyViewed } from "@lib/aquora/retail-track"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { PaymentMethods } from "@modules/common/components/payment-trust"
import { toast } from "@modules/common/components/toast"
import { useRouter } from "next/navigation"
import { useExperiment, ADD_TO_CART_CTA } from "@modules/analytics/experiment"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string
  // A/B harness: deterministic, inline-rendered add-to-cart CTA label (control on SSR).
  const cta = useExperiment(ADD_TO_CART_CTA)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    // Single-variant products: always select the only variant. Avoids an intermittent
    // "Select a model" state when option-keymap matching races hydration / missing option_id.
    if (product.variants.length === 1) {
      return product.variants[0]
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    if (product.variants?.length === 1) {
      return true
    }
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  // True only when we hold real, counted stock — so the "ships within 48 hours" promise is
  // honest. Backorder / non-inventory-tracked variants are purchasable but NOT a 48h promise.
  const stockTracked = useMemo(
    () =>
      !!(
        selectedVariant?.manage_inventory &&
        (selectedVariant?.inventory_quantity || 0) > 0
      ),
    [selectedVariant]
  )

  // GA4 view_item once per product view
  useEffect(() => {
    trackViewItem({
      id: product.id,
      name: product.title,
      price: (selectedVariant as any)?.calculated_price?.calculated_amount,
      category: (product as any).categories?.[0]?.name,
    })
    // Google Retail personalization signals (Phase 2).
    trackRetailEvent("detail-page-view", { productHandles: [product.handle] })
    recordRecentlyViewed(product.handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    trackAddToCart({
      id: selectedVariant.id,
      name: product.title,
      price: (selectedVariant as any)?.calculated_price?.calculated_amount,
      quantity,
      category: (product as any).categories?.[0]?.name,
    })
    trackRetailEvent("add-to-cart", { productHandles: [product.handle] })

    // Confirm the add: the toast works everywhere (the cart dropdown is desktop-only and hidden on
    // mobile), and router.refresh() re-renders the server CartButton so the badge updates and the
    // desktop dropdown auto-opens. Without this the most important micro-moment gave zero feedback.
    toast.success(
      "Added to cart",
      quantity > 1 ? `${quantity} × ${product.title}` : product.title
    )
    router.refresh()

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        {selectedVariant && inStock && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-aquora-muted">Quantity</span>
            <div className="inline-flex items-center rounded-md border border-black/15">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isAdding}
                aria-label="Decrease quantity"
                className="h-11 w-11 grid place-items-center text-lg leading-none text-aquora-ink disabled:opacity-40 hover:bg-black/[0.04] transition-colors"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                disabled={quantity >= 99 || isAdding}
                aria-label="Increase quantity"
                className="h-11 w-11 grid place-items-center text-lg leading-none text-aquora-ink disabled:opacity-40 hover:bg-black/[0.04] transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-12 text-base font-semibold"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? "Select a model"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : cta.label}
        </Button>

        {selectedVariant && inStock && (
          <ul className="mt-4 flex flex-col gap-2 text-xs text-aquora-muted">
            {stockTracked ? (
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                In stock — ships within 48 hours across the UAE
              </li>
            ) : (
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-aquora-accent" aria-hidden />
                Available to order — we&apos;ll confirm your dispatch date
              </li>
            )}
            <li className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="shrink-0 text-aquora-primary" aria-hidden>
                <path d="M8 1.5 3 3.5v4c0 3 2.2 5.2 5 6.5 2.8-1.3 5-3.5 5-6.5v-4L8 1.5Z" strokeLinejoin="round" />
              </svg>
              Genuine product · manufacturer warranty · easy returns
            </li>
            <li className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-aquora-primary" aria-hidden>
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Secure, encrypted checkout
            </li>
          </ul>
        )}

        {selectedVariant && inStock && <PaymentMethods className="mt-3" />}

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          ctaLabel={cta.label}
        />
      </div>
    </>
  )
}
