import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import LoginTemplate from "@modules/account/templates/login-template"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Account",
  description: "Your Aquora account — orders, addresses and a faster checkout.",
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const customer = await retrieveCustomer().catch(() => null)

  // Logged out → sign-in / register; logged in → account overview. The view is driven by the
  // URL (?view=register) so the sign-in ↔ register switch works via navigation even if the
  // client subtree hasn't hydrated.
  if (!customer) {
    const { view } = await searchParams
    return (
      <LoginTemplate initialView={view === "register" ? "register" : "sign-in"} />
    )
  }

  const orders = (await listOrders().catch(() => null)) || null
  return <Overview customer={customer} orders={orders} />
}
