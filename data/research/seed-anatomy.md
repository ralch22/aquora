Based on my research, I now have comprehensive information. Let me compile the final report:

## Medusa v2 Default Seed Script Anatomy (seed.ts)

### **Execution Command**
```bash
npx medusa exec ./src/scripts/seed.ts
```

### **Import Paths (from @medusajs/medusa/core-flows)**
```typescript
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  updateStoresStep,
} from "@medusajs/medusa/core-flows";
```

### **Workflow Execution Order**

1. **createSalesChannelsWorkflow** – Create/verify default sales channel
   - Input: `{ salesChannelsData: [{ name: "Default Sales Channel" }] }`

2. **updateStoreCurrencies** (custom workflow) – Set supported currencies on store (EUR as default, USD as alternate)

3. **updateStoresWorkflow** – Link default sales channel to store

4. **createRegionsWorkflow** – Create region (e.g., "Europe")
   - Input: `{ regions: [{ name: "Europe", currency_code: "eur", countries: ["gb", "de", "dk", "se", "fr", "es", "it"], payment_providers: ["pp_system_default"] }] }`

5. **createTaxRegionsWorkflow** – Create tax regions per country

6. **createStockLocationsWorkflow** – Create stock/warehouse location
   - Input: `{ locations: [{ name: "European Warehouse", address: { city: "Copenhagen", country_code: "DK", address_1: "" } }] }`

7. **updateStoresWorkflow** – Set default location on store

8. **Link** (manual) – Link stock location to fulfillment provider
   - Uses `link.create()` with `Modules.STOCK_LOCATION` and `Modules.FULFILLMENT`

9. **createShippingProfilesWorkflow** – Create shipping profile
   - Input: `{ data: [{ name: "Default Shipping Profile", type: "default" }] }`

10. **createFulfillmentSets** (manual service call) – Create fulfillment set with service zones for countries

11. **Link** (manual) – Link stock location to fulfillment set

12. **createShippingOptionsWorkflow** – Create shipping options (Standard, Express)
    - Input array with objects: `{ name, price_type: "flat", provider_id, service_zone_id, shipping_profile_id, type: { label, description, code }, prices: [{currency_code, amount}], rules }`

13. **linkSalesChannelsToStockLocationWorkflow** – Connect sales channel to stock location

14. **createApiKeysWorkflow** – Create/verify publishable API key
    - Input: `{ api_keys: [{ title: "Webshop", type: "publishable", created_by: "" }] }`

15. **linkSalesChannelsToApiKeyWorkflow** – Connect sales channel to API key

16. **createProductCategoriesWorkflow** – Create product categories
    - Input: `{ product_categories: [{ name: "Shirts", is_active: true }, ...] }`
    - Returns: `categoryResult` array with `.id` for each category

17. **createProductsWorkflow** – Create products with variants
    - Input shape below ↓

18. **createInventoryLevelsWorkflow** – Set inventory quantities per location

---

### **createProductCategoriesWorkflow Input/Output**

**Input:**
```typescript
{
  product_categories: Array<{
    name: string
    description?: string
    handle?: string
    is_active: boolean
    is_internal?: boolean
    rank?: number
    parent_category_id?: string | null
    external_id?: string | null
    metadata?: Record<string, unknown>
  }>
  additional_data?: Record<string, unknown>
}
```

**Output:**
```typescript
result: Array<{
  id: string
  name: string
  is_active: boolean
  // + other fields
}>
```

To assign products to categories, store the category `.id` from the result:
```typescript
const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({...})
const categoryId = categoryResult.find(cat => cat.name === "Shirts")!.id
```

---

### **createProductsWorkflow Input Shape**

```typescript
{
  products: Array<{
    title: string                           // Required: "Medusa T-Shirt"
    description?: string
    handle?: string                         // URL slug: "t-shirt"
    status?: ProductStatus                  // "PUBLISHED" or "DRAFT"
    weight?: number
    width?: number
    length?: number
    height?: number
    origin_country?: string
    hs_code?: string
    mid_code?: string
    material?: string
    is_giftcard?: boolean
    discountable?: boolean
    external_id?: string | null
    collection_id?: string | null
    type_id?: string | null
    tags?: Array<{ value: string }>
    
    category_ids?: string[]                 // Category IDs from createProductCategoriesWorkflow result
    
    images?: Array<{                        // Product images
      url: string
    }>
    
    shipping_profile_id?: string            // From createShippingProfilesWorkflow
    
    options: Array<{                        // Product options (Size, Color, etc.)
      title: string                         // "Size"
      values: string[]                      // ["S", "M", "L", "XL"]
    }>
    
    variants: Array<{
      title: string                         // "S / Black"
      sku?: string                          // "SHIRT-S-BLACK"
      barcode?: string
      ean?: string
      upc?: string
      
      options: Record<string, string>       // Maps option title to selected value
      // Example: { "Size": "S", "Color": "Black" }
      
      prices: Array<{
        amount: number                      // Price amount (see note below)
        currency_code: string               // "eur", "usd"
      }>
      
      manage_inventory: boolean
      allow_backorder?: boolean
      requires_shipping?: boolean
      weight?: number
      length?: number
      height?: number
      width?: number
      hs_code?: string
      origin_country?: string
      mid_code?: string
      material?: string
      metadata?: Record<string, unknown>
    }>
    
    sales_channels: Array<{                 // Link products to sales channels
      id: string                            // defaultSalesChannel[0].id
    }>
    
    metadata?: Record<string, unknown>
  }>
  
  additional_data?: Record<string, unknown>
}
```

**Example Product with Variants:**
```typescript
{
  title: "Medusa T-Shirt",
  category_ids: ["cat_123"],
  description: "...",
  handle: "t-shirt",
  weight: 400,
  status: ProductStatus.PUBLISHED,
  shipping_profile_id: shippingProfile.id,
  images: [
    { url: "https://..." },
    { url: "https://..." }
  ],
  options: [
    { title: "Size", values: ["S", "M", "L", "XL"] },
    { title: "Color", values: ["Black", "White"] }
  ],
  variants: [
    {
      title: "S / Black",
      sku: "SHIRT-S-BLACK",
      options: { Size: "S", Color: "Black" },
      prices: [
        { amount: 10, currency_code: "eur" },
        { amount: 15, currency_code: "usd" }
      ]
    }
  ],
  sales_channels: [{ id: defaultSalesChannel[0].id }]
}
```

---

### **Price Amount Units**

Based on the default seed script, prices are specified in **major units** (dollars/euros, not cents):
- `{ amount: 10, currency_code: "eur" }` = 10 EUR
- `{ amount: 15, currency_code: "usd" }` = 15 USD

This differs from many e-commerce systems. The seed script uses straightforward decimal values without multiplying by 100.

---

### **Key Integration Points**

- **Sales channel linking:** `linkSalesChannelsToStockLocationWorkflow`, `linkSalesChannelsToApiKeyWorkflow`
- **Inventory:** Query all `inventory_item` entities after product creation, then call `createInventoryLevelsWorkflow` for each with `stocked_quantity`
- **Manual service calls:** Some operations (fulfillment sets, fulfillment set linking) bypass workflows and use module services directly (e.g., `fulfillmentModuleService.createFulfillmentSets()`)

---

### **Default Seed Script Source**
[medusa-starter-default/src/scripts/seed.ts](https://github.com/medusajs/medusa-starter-default/blob/master/src/scripts/seed.ts) on GitHub

Sources:
- [Seed Data with Custom CLI Script - Medusa Documentation](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts/seed-data)
- [Custom CLI Scripts - Medusa Documentation](https://docs.medusajs.com/v2/advanced-development/custom-cli-scripts)
- [createProductsWorkflow - Medusa Core Workflows Reference](https://docs.medusajs.com/resources/references/medusa-workflows/createProductsWorkflow)
- [createProductCategoriesWorkflow - Medusa Core Workflows Reference](https://docs.medusajs.com/resources/references/medusa-workflows/createProductCategoriesWorkflow)
- [createRegionsWorkflow - Medusa Core Workflows Reference](https://docs.medusajs.com/resources/references/medusa-workflows/createRegionsWorkflow)
- [createShippingOptionsWorkflow - Medusa Core Workflows Reference](https://docs.medusajs.com/resources/references/medusa-workflows/createShippingOptionsWorkflow)
- [medusa-starter-default Repository](https://github.com/medusajs/medusa-starter-default)