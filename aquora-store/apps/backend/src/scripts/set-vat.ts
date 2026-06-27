import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Sets a 5% default VAT rate on the UAE tax region so AED carts charge UAE VAT. The tax
// regions themselves are created by import-catalog.ts (tp_system provider) but with no rate.
// Idempotent: skips if a default rate already exists. Run ONLY if the business is VAT-registered:
//   npx medusa exec ./src/scripts/set-vat.ts
// Note: whether displayed prices are tax-inclusive is a separate region/price setting — decide
// with the owner; UAE retail convention is VAT-inclusive display.
export default async function setVat({ container }: ExecArgs) {
  const tax: any = container.resolve(Modules.TAX)

  const regions = await tax.listTaxRegions({}, { take: 100 })
  const ae = regions.find((r: any) => (r.country_code || "").toLowerCase() === "ae")
  if (!ae) {
    console.error("UAE tax region not found — run import-catalog first.")
    return
  }

  const existing = await tax.listTaxRates({ tax_region_id: ae.id }, { take: 100 })
  const hasDefault = existing.find((r: any) => r.is_default)
  if (hasDefault) {
    console.log(`UAE tax region already has a default rate of ${hasDefault.rate}% — no change.`)
    return
  }

  await tax.createTaxRates([
    {
      tax_region_id: ae.id,
      name: "VAT",
      code: "VAT",
      rate: 5,
      is_default: true,
    },
  ])
  console.log(`Created 5% default VAT on UAE tax region ${ae.id}.`)
}
