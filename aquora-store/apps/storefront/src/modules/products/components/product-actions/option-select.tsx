import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { clx } from "@modules/common/components/ui"
import React from "react"

// Honest, variant-derived hint for a single option value. Both fields are optional:
// we only ever render a hint when real inventory/price data backs it.
export type OptionValueHint = {
  // Every variant carrying this value is genuinely out of stock.
  disabled?: boolean
  // Cheapest variant with this value costs this much more than the product's
  // cheapest variant (positive amount, in the product currency).
  priceDelta?: number
}

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  valueHints?: Record<string, OptionValueHint>
  currencyCode?: string
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  valueHints,
  currencyCode,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
      <div
        className="flex flex-wrap justify-between gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const hint = valueHints?.[v]
          const isUnavailable = !!hint?.disabled
          const delta =
            hint?.priceDelta && hint.priceDelta > 0 ? hint.priceDelta : undefined
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-black/10 bg-aquora-surface border text-small-regular min-h-10 rounded-lg p-2 flex-1 flex flex-col items-center justify-center gap-0.5",
                {
                  "border-aquora-primary": v === current,
                  "hover:shadow-sm transition-shadow ease-in-out duration-150":
                    v !== current && !isUnavailable,
                  "opacity-40 cursor-not-allowed": isUnavailable,
                }
              )}
              disabled={disabled || isUnavailable}
              title={isUnavailable ? "Out of stock" : undefined}
              data-testid="option-button"
            >
              <span>{v}</span>
              {isUnavailable ? (
                <span className="text-xs text-aquora-muted">Out of stock</span>
              ) : delta && currencyCode ? (
                <span className="text-xs text-aquora-muted">
                  +
                  {convertToLocale({
                    amount: delta,
                    currency_code: currencyCode,
                  })}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
