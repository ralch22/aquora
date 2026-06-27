import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

// Associates the live Stripe provider with the AED (UAE) region so the card option
// appears at checkout, MERGING with the existing manual provider (never replacing it).
// Resolves the real registered provider id at runtime (e.g. "pp_stripe_stripe") instead
// of hard-coding it. MUST run AFTER STRIPE_API_KEY is set on the backend (otherwise the
// provider isn't registered). Run: npx medusa exec ./src/scripts/add-stripe-to-ae-region.ts
export default async function addStripeToAeRegion({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const paymentService = container.resolve(Modules.PAYMENT)

  const providers = await paymentService.listPaymentProviders({}, { take: 100 })
  const stripe = providers.find((p: any) => p.id?.startsWith("pp_stripe"))
  if (!stripe) {
    console.error(
      "Stripe provider not registered — set STRIPE_API_KEY on the backend, redeploy, then re-run."
    )
    return
  }
  console.log("Registered Stripe provider id:", stripe.id)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
    filters: { currency_code: "aed" },
  })
  const region = regions?.[0]
  if (!region) {
    console.error("AED region not found.")
    return
  }

  const existing = (region.payment_providers || []).map((p: any) => p.id)
  if (existing.includes(stripe.id)) {
    console.log(`Stripe already on region ${region.id} (${region.name}).`)
    return
  }
  const providerIds = Array.from(new Set([...existing, stripe.id]))

  await updateRegionsWorkflow(container).run({
    input: { selector: { id: region.id }, update: { payment_providers: providerIds } },
  })
  console.log(
    `OK: region ${region.id} (${region.name}) payment_providers -> ${providerIds.join(", ")}`
  )
}
