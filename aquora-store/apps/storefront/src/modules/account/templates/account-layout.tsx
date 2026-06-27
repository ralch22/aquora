import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="content-container mx-auto flex h-full max-w-5xl flex-1 flex-col">
        <div className="grid grid-cols-1 gap-8 py-12 small:grid-cols-[260px_1fr]">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col items-start justify-between gap-6 rounded-[1.5rem] border border-black/[0.06] bg-aquora-surface/50 p-8 mb-12 small:flex-row small:items-center">
          <div>
            <h3 className="font-heading text-xl font-bold tracking-tight text-aquora-ink">Got questions?</h3>
            <span className="mt-1 block text-aquora-muted">
              Find answers on our customer service page, or reach our team directly.
            </span>
          </div>
          <UnderlineLink href="/customer-service">Customer Service</UnderlineLink>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
