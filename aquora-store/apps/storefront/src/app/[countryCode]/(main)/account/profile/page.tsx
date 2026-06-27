import { Metadata } from "next"

import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Aquora profile.",
}

export default async function Profile() {
  const customer = await retrieveCustomer().catch(() => null)
  const regions = await listRegions().catch(() => null)

  // Logged-out: render nothing (the @login slot is shown by the layout) instead of
  // throwing notFound() from this hidden parallel slot, which would crash the route.
  if (!customer || !regions) {
    return null
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          Your account
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink">Profile</h1>
        <p className="max-w-xl text-aquora-muted">
          View and update your name, phone number and billing address. Your email is
          used to sign in.
        </p>
      </div>
      <div className="flex flex-col gap-y-8 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfileEmail customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
        <Divider />
        {/* <ProfilePassword customer={customer} />
        <Divider /> */}
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}

const Divider = () => {
  return <div className="w-full h-px bg-black/[0.06]" />
}
