import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import LoginTemplate from "@modules/account/templates/login-template"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Account",
  description: "Your Aquora account — orders, addresses and a faster checkout.",
}

export default async function AccountPage() {
  const customer = await retrieveCustomer().catch(() => null)

  // Logged out → sign-in / register; logged in → account overview.
  if (!customer) {
    return <LoginTemplate />
  }

  const orders = (await listOrders().catch(() => null)) || null
  return <Overview customer={customer} orders={orders} />
}
