import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateShippingOptionsWorkflow } from "@medusajs/medusa/core-flows"

// Makes checkout honor the site-wide "free delivery over AED 500" promise (UI, Product
// JSON-LD and shipping.md all advertise it; the option itself only charged a flat AED 30).
// Adds conditional AED-0 prices to the existing "Standard Delivery" shipping option using
// Pricing Module price rules: when the cart's item_total >= 500, the 0 price wins.
// Existing flat-30 prices are kept (by id) for carts under the threshold.
// Idempotent: skips if a 0-amount price with an item_total rule already exists.
//   npx medusa exec ./src/scripts/free-shipping-over-500.ts
const THRESHOLD = 500

export default async function freeShippingOver500({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "prices.id",
      "prices.amount",
      "prices.currency_code",
      "prices.price_rules.attribute",
      "prices.price_rules.operator",
      "prices.price_rules.value",
    ],
    filters: { name: "Standard Delivery" },
  })

  // graph result types don't surface joined price fields — treat as loose data
  const option = options?.[0] as any
  if (!option) {
    console.error("Shipping option 'Standard Delivery' not found — run import-catalog first.")
    return
  }

  const prices: any[] = option.prices || []
  const alreadyFree = prices.find(
    (p) =>
      Number(p?.amount) === 0 &&
      (p?.price_rules || []).some((r: any) => r?.attribute === "item_total")
  )
  if (alreadyFree) {
    console.log(
      `'${option.name}' already has a free-over-threshold price (price ${alreadyFree.id}) — no change.`
    )
    return
  }

  // AED region id (the flat prices were created once per currency and once per region).
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
    filters: { currency_code: "aed" },
  })
  const region = regions?.[0]

  const freeRule = [{ attribute: "item_total", operator: "gte" as const, value: THRESHOLD }]
  const updatedPrices: any[] = [
    // keep every existing price record untouched
    ...prices.map((p) => ({ id: p.id })),
    // free tier at/above the threshold
    { currency_code: "aed", amount: 0, rules: freeRule },
    ...(region ? [{ region_id: region.id, amount: 0, rules: freeRule }] : []),
  ]

  await updateShippingOptionsWorkflow(container).run({
    input: [{ id: option.id, prices: updatedPrices }],
  })

  console.log(
    `'${option.name}' (${option.id}): added AED 0 price for item_total >= ${THRESHOLD}` +
      (region ? ` (currency + region ${region.id})` : " (currency only)") +
      `; kept ${prices.length} existing price(s).`
  )
}
