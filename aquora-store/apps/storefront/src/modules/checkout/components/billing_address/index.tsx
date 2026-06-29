import { HttpTypes } from "@medusajs/types"
import Input from "@modules/common/components/input"
import React, { useState } from "react"
import CountrySelect from "../country-select"

const BillingAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  })

  // Per-field required validation, mirroring the shipping form: validate on blur, then
  // re-validate on change only once a field has errored. Native `required` stays the hard
  // submit gate; these inline messages are additive (rose border + message via the Input/select).
  const REQUIRED_FIELDS = new Set([
    "billing_address.first_name",
    "billing_address.last_name",
    "billing_address.address_1",
    "billing_address.postal_code",
    "billing_address.country_code",
  ])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const requiredMessage = (name: string): string => {
    switch (name) {
      case "billing_address.first_name":
        return "First name is required."
      case "billing_address.last_name":
        return "Last name is required."
      case "billing_address.address_1":
        return "Address is required."
      case "billing_address.postal_code":
        return "Postal code is required."
      case "billing_address.country_code":
        return "Country is required."
      default:
        return "This field is required."
    }
  }
  const validateRequired = (name: string, value: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (!value || !value.trim()) {
        next[name] = requiredMessage(name)
      } else {
        delete next[name]
      }
      return next
    })
  }
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (REQUIRED_FIELDS.has(e.target.name)) {
      validateRequired(e.target.name, e.target.value)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Re-validate a required field on change only after it has first errored.
    if (REQUIRED_FIELDS.has(e.target.name) && fieldErrors[e.target.name]) {
      validateRequired(e.target.name, e.target.value)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["billing_address.first_name"]}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Last name"
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["billing_address.last_name"]}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label="Address"
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["billing_address.address_1"]}
          required
          data-testid="billing-address-input"
        />
        <Input
          label="Company"
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label="Postal code"
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["billing_address.postal_code"]}
          required
          data-testid="billing-postal-input"
        />
        <Input
          label="City"
          name="billing_address.city"
          autoComplete="address-level2"
          value={formData["billing_address.city"]}
          onChange={handleChange}
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["billing_address.country_code"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["billing_address.country_code"]}
          required
          data-testid="billing-country-select"
        />
        <Input
          label="State / Province"
          name="billing_address.province"
          autoComplete="address-level1"
          value={formData["billing_address.province"]}
          onChange={handleChange}
          data-testid="billing-province-input"
        />
        <Input
          label="Phone"
          name="billing_address.phone"
          autoComplete="tel"
          value={formData["billing_address.phone"]}
          onChange={handleChange}
          data-testid="billing-phone-input"
        />
      </div>
    </>
  )
}

export default BillingAddress
