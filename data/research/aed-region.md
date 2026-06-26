Excellent. Now I have enough information. Let me compile the complete answer with all the precise code and API details.

## Medusa v2 AED Currency & Regional Setup

Based on official Medusa v2 documentation, here is the precise implementation:

---

### 1. Add AED to Store's Supported Currencies

**Status:** AED (United Arab Emirates Dirham) is pre-loaded via the Currency Module. Medusa loads "all common currencies" automatically.

**Retrieve AED Currency:**
```ts
import { Modules } from "@medusajs/framework/utils"

const currencyModuleService = container.resolve(Modules.CURRENCY)
const aedCurrency = await currencyModuleService.retrieveCurrency("aed")
```

**List available currencies:**
```ts
const currencies = await currencyModuleService.listCurrencies({
  code: ["usd", "eur", "aed"],
})
```

**Import path:** `@medusajs/framework/utils` → `Modules.CURRENCY`

---

### 2. Create Region "United Arab Emirates" with `createRegionsWorkflow`

**Workflow import:**
```ts
import { createRegionsWorkflow } from "@medusajs/medusa/core-flows"
```

**Code to create UAE region with AED:**
```ts
const { result } = await createRegionsWorkflow(req.scope)
  .run({
    input: {
      regions: [
        {
          name: "United Arab Emirates",
          currency_code: "aed",
          countries: ["ae"],
          payment_providers: ["manual"],
          automatic_taxes: false,
          is_tax_inclusive: false,
        },
      ],
    },
  })

const uaeRegion = result[0]
// uaeRegion.id is the region ID for pricing
```

**API Signature:**
```ts
createRegionsWorkflow(scope: MedusaContainer).run({
  input: {
    regions: CreateRegionDTO[]
  }
}): Promise<{ result: Region[] }>
```

**CreateRegionDTO fields:**
- `name` (string): Region display name
- `currency_code` (string): ISO 3-letter code ("aed")
- `countries` (string[]): ISO 2-letter country codes (["ae"])
- `payment_providers` (string[]): At least one provider required
- `automatic_taxes` (boolean): Auto-calculate taxes
- `is_tax_inclusive` (boolean): Enable tax-inclusive pricing for this region
- `metadata` (Record<string, any>): Custom data (optional)

**Workflow steps internally:** `createRegionsStep` → `setRegionsPaymentProvidersStep`

---

### 3. Price Product Variants in AED

**Step 1: Create a PriceSet with AED**

```ts
import { Modules } from "@medusajs/framework/utils"

const pricingModuleService = container.resolve(Modules.PRICING)

const priceSet = await pricingModuleService.createPriceSets({
  prices: [
    {
      amount: 49999, // Price in fils (e.g., AED 499.99)
      currency_code: "aed",
      region_id: "reg_<uae_region_id>", // Optional: region-specific pricing
    },
    // Additional currency prices
    {
      amount: 15000,
      currency_code: "usd",
    },
  ],
})
```

**API Signature:**
```ts
createPriceSets(
  data: CreatePriceSetDTO | CreatePriceSetDTO[],
  sharedContext?: Context
): Promise<PriceSetDTO | PriceSetDTO[]>
```

**Price object fields:**
- `amount` (number): Price in base unit (smallest denomination)
- `currency_code` (string): "aed"
- `rules` (Record<string, any>): Optional region/city rules
- `region_id` (string): Optional — region-specific override
- `min_quantity`, `max_quantity`: Tiered pricing support

**Step 2: Link PriceSet to ProductVariant**

```ts
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"

createRemoteLinkStep({
  [Modules.PRODUCT]: {
    variant_id: "variant_123",
  },
  [Modules.PRICING]: {
    price_set_id: priceSet.id,
  },
})
```

**Step 3: Retrieve Variant Price with AED in Storefront**

```ts
import { QueryContext } from "@medusajs/framework/utils"

const { data: products } = await query.graph({
  entity: "product",
  fields: ["*", "variants.*", "variants.calculated_price.*"],
  filters: { id: "prod_123" },
  context: {
    variants: {
      calculated_price: QueryContext({
        region_id: "reg_<uae_region_id>",
        currency_code: "aed",
      }),
    },
  },
})

// Access price: products[0].variants[0].calculated_price.calculated_amount
```

---

### 4. Tax-Inclusive Pricing per Region/Currency

**Enable tax-inclusive for AED region:**

```ts
await createRegionsWorkflow(req.scope)
  .run({
    input: {
      regions: [{
        name: "United Arab Emirates",
        currency_code: "aed",
        countries: ["ae"],
        is_tax_inclusive: true, // Enable tax-inclusive
        automatic_taxes: true,
      }],
    },
  })
```

**Alternatively, via PricePreference:**

```ts
// Configure tax-inclusivity at currency level
const pricePreference = {
  attribute: "currency_code",
  value: "aed",
  is_tax_inclusive: true,
}
```

**Tax calculation formula (tax-inclusive):**
```
taxAmount = (taxRate * taxInclusivePrice) / (1 + taxRate)
```

Where `taxInclusivePrice` is the storefront price. Tax is extracted from the price, not added to it.

**Data model attributes:**
- `Region.includes_tax` (boolean)
- `Currency.includes_tax` (boolean)
- `PriceList.includes_tax` (boolean)
- `ShippingOption.includes_tax` (boolean)

---

### 5. Default Currency Handling

**Store default currency:** Set in **Settings → Store → Default Currency** (Admin). When not explicitly specified, queries default to this currency.

**Per-request currency override:** Always pass `currency_code` in query context to ensure correct regional pricing.

---

### Key Import Paths

| Component | Import |
|-----------|--------|
| Workflows | `@medusajs/medusa/core-flows` |
| Modules | `@medusajs/framework/utils` → `Modules` |
| Steps | `@medusajs/medusa/core-flows` |
| Query Context | `@medusajs/framework/utils` → `QueryContext` |

---

**Sources:**
- [createRegionsWorkflow API Reference](https://docs.medusajs.com/resources/references/medusa-workflows/createRegionsWorkflow)
- [Region Module](https://docs.medusajs.com/resources/commerce-modules/region)
- [Currency Module](https://docs.medusajs.com/resources/commerce-modules/currency)
- [Pricing Module](https://docs.medusajs.com/resources/commerce-modules/pricing)
- [createPriceSets API](https://docs.medusajs.com/resources/references/pricing/createPriceSets)
- [Tax-Inclusive Pricing](https://docs.medusajs.com/resources/commerce-modules/pricing/tax-inclusive-pricing)
- [Product Variant Pricing Guide](https://docs.medusajs.com/resources/commerce-modules/product/guides/price)
- [Links between Pricing and Product Modules](https://docs.medusajs.com/resources/commerce-modules/pricing/links-to-other-modules)
- [Workflows Tutorial](https://docs.medusajs.com/learn/fundamentals/workflows)
- [Multi-Region Store Recipe](https://docs.medusajs.com/resources/recipes/multi-region-store)