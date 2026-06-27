import React from "react"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

// Email is the login identity in Medusa v2 and isn't self-service editable, so we
// display it read-only rather than offering an editor that does nothing.
const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  return (
    <div className="w-full" data-testid="account-email-display">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-aquora-ink">Email</span>
          <span className="mt-1 text-aquora-muted">{customer.email}</span>
        </div>
        <span className="text-xs text-aquora-muted/80">
          Contact support to change your email
        </span>
      </div>
    </div>
  )
}

export default ProfileEmail
