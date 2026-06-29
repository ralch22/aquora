import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { mapKeys } from "lodash"

// The seven UAE emirates — used as the "State / Province" selector when the
// destination is the UAE (free-text province + a required postal code the UAE
// doesn't use are a known checkout-abandonment driver).
const UAE_EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
]
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    // UAE-first store: default the country to AE when the region supports it and
    // nothing is saved yet, so the buyer skips a field and the emirate selector shows.
    "shipping_address.country_code":
      cart?.shipping_address?.country_code ||
      (cart?.region?.countries?.some((c) => c.iso_2 === "ae") ? "ae" : ""),
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  // Friendly inline email validation (the most error-prone field). Native `required` still
  // gates submit; this just surfaces a clear message on blur instead of a browser tooltip.
  const [emailError, setEmailError] = useState<string | null>(null)
  const validateEmail = (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Enter a valid email address (e.g. name@example.com).")
    } else {
      setEmailError(null)
    }
  }

  // Per-field required validation, mirroring the email pattern: validate on blur, then
  // re-validate on change only once a field has errored. Native `required` stays the hard
  // submit gate; these inline messages are additive (rose border + message via the Input/select).
  const REQUIRED_FIELDS = new Set([
    "shipping_address.first_name",
    "shipping_address.last_name",
    "shipping_address.address_1",
    "shipping_address.city",
    "shipping_address.country_code",
    "shipping_address.province",
  ])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const requiredMessage = (name: string): string => {
    switch (name) {
      case "shipping_address.first_name":
        return "First name is required."
      case "shipping_address.last_name":
        return "Last name is required."
      case "shipping_address.address_1":
        return "Address is required."
      case "shipping_address.city":
        return "City is required."
      case "shipping_address.country_code":
        return "Country is required."
      case "shipping_address.province":
        return formData["shipping_address.country_code"] === "ae"
          ? "Emirate is required."
          : "State / Province is required."
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

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

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
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as unknown as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["shipping_address.first_name"]}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["shipping_address.last_name"]}
          required
          data-testid="shipping-last-name-input"
        />
        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["shipping_address.address_1"]}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label="Company"
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <Input
          label="Postal code (optional)"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          data-testid="shipping-postal-code-input"
        />
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["shipping_address.city"]}
          required
          data-testid="shipping-city-input"
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldErrors["shipping_address.country_code"]}
          required
          data-testid="shipping-country-select"
        />
        {formData["shipping_address.country_code"] === "ae" ? (
          <NativeSelect
            name="shipping_address.province"
            autoComplete="address-level1"
            placeholder="Emirate"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors["shipping_address.province"]}
            data-testid="shipping-province-select"
          >
            {UAE_EMIRATES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <Input
            label="State / Province"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            onBlur={handleBlur}
            error={fieldErrors["shipping_address.province"]}
            data-testid="shipping-province-input"
          />
        )}
      </div>
      <div className="my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={(e) => {
            handleChange(e)
            if (emailError) validateEmail(e.target.value)
          }}
          onBlur={(e) => validateEmail(e.target.value)}
          error={emailError ?? undefined}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
