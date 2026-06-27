import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)

  // When logged out, the account layout renders the @login slot instead — so this
  // (parallel) slot must render nothing. Throwing notFound() here would blow up the
  // whole /account route (NEXT_HTTP_ERROR_FALLBACK) and break the sign-in page.
  if (!customer) {
    return null
  }

  const orders = (await listOrders().catch(() => null)) || null
  return <Overview customer={customer} orders={orders} />
}
