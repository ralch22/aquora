"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Product Information",
      component: <ProductInfoTab product={product} />,
    },
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const md = (product.metadata as any) || {}
  const details = (md.details as string | undefined) || product.description
  const specs = (md.specs as { name: string; value: string }[]) || []

  return (
    <div className="py-6">
      {details && (
        <div className="mb-7 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-aquora-muted">
          {details}
        </div>
      )}

      {specs.length > 0 && (
        <div className="overflow-hidden rounded-large border border-black/10">
          <dl className="divide-y divide-black/5">
            {specs.map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                className="grid grid-cols-[1fr_1.2fr] gap-4 px-5 py-3 odd:bg-aquora-surface/60"
              >
                <dt className="text-sm text-aquora-muted">{s.name}</dt>
                <dd className="text-sm font-semibold text-aquora-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {!details && !specs.length && (
        <p className="text-small-regular text-aquora-muted">
          Detailed specifications available on request.
        </p>
      )}
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">UAE-wide delivery</span>
            <p className="max-w-sm text-aquora-muted">
              In-stock equipment is dispatched within 48 hours and delivered
              across the UAE and wider GCC. Free delivery on orders over AED 500.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Genuine &amp; warrantied</span>
            <p className="max-w-sm text-aquora-muted">
              Every item is authentic, authorised stock with full manufacturer
              warranty — backed by our local technical and after-sales team.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Returns</span>
            <p className="max-w-sm text-aquora-muted">
              Unused items in their original packaging can be returned in line
              with our{" "}
              <LocalizedClientLink
                href="/legal/returns"
                className="font-medium text-aquora-primary hover:underline"
              >
                returns policy
              </LocalizedClientLink>
              . Questions before you buy? Our team can confirm fit and
              compatibility first.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
