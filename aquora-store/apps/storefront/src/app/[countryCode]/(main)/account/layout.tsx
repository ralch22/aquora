import { retrieveCustomer } from "@lib/data/customer"
import AccountLayout from "@modules/account/templates/account-layout"

// Standard (non-parallel) account layout. Parallel routes (@dashboard/@login) were dropped
// because `next start` on Cloud Run 404s static chunks under "@"-prefixed slot folders,
// which broke hydration on /account in production. AccountLayout shows the nav only when a
// customer is present, so the logged-out login view renders cleanly here too.
export default async function AccountPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return <AccountLayout customer={customer}>{children}</AccountLayout>
}
