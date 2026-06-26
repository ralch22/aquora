Based on my research of Medusa v2 documentation, here is the complete payment module configuration for system default (manual) and Stripe providers:

## Medusa v2 Payment Module Configuration (medusa-config.ts)

```typescript
import { defineConfig } from "@medusajs/framework";

export default defineConfig({
  projectConfig: {
    // ... other config
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          // System default provider (no keys required - dev checkout)
          {
            resolve: "@medusajs/medusa/payment-system",
            id: "system",
            options: {},
          },
          // Stripe provider (gated behind STRIPE_API_KEY env var)
          ...(process.env.STRIPE_API_KEY
            ? [
                {
                  resolve: "@medusajs/medusa/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: process.env.STRIPE_API_KEY,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                    capture: false, // authorize only, capture on order fulfillment
                    automatic_payment_methods: true, // enable Apple Pay/Google Pay
                  },
                },
              ]
            : []),
        ],
      },
    },
  ],
});
```

## Provider IDs (as registered in Medusa)

| Provider | Identifier | ID | Final Provider ID |
|----------|------------|----|-------------------|
| System (Manual) | `system` | `system` | `pp_system_system` |
| Stripe | `stripe` | `stripe` | `pp_stripe_stripe` |

## Next.js Storefront: Payment Session Initialization

In the checkout `Payment` component (`src/modules/checkout/components/payment/index.tsx`), initialize payment sessions using the SDK:

```typescript
import { initiatePaymentSession } from "@medusajs/js-sdk";

export function PaymentStep({ cart, onSuccess }) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handlePaymentInit = async (providerId: string) => {
    try {
      await initiatePaymentSession(cart, {
        provider_id: providerId, // e.g., "pp_system_system" or "pp_stripe_stripe"
      });
      setSelectedProvider(providerId);
      onSuccess();
    } catch (error) {
      console.error("Failed to initialize payment session:", error);
    }
  };

  return (
    <div>
      <button onClick={() => handlePaymentInit("pp_system_system")}>
        Manual Payment
      </button>
      {process.env.NEXT_PUBLIC_STRIPE_KEY && (
        <button onClick={() => handlePaymentInit("pp_stripe_stripe")}>
          Pay with Stripe
        </button>
      )}
    </div>
  );
}
```

## What Makes Dev Checkout Work Without Real Keys

The **system payment provider** (`pp_system_system`) is a placeholder that:
- **Requires no API keys** — no `apiKey` or `webhookSecret` needed
- **Delegates payment to merchant** — similar to cash-on-delivery
- **Allows order completion** — marks cart as ready to complete without third-party processing
- **Works with zero totals** — unlike Stripe, which requires positive amounts
- **Ideal for dev/testing** — enables full checkout flow without external credentials

This allows you to test the complete checkout flow (address, shipping, payment selection, order creation) entirely locally.

## Stripe Configuration Notes

- **Provider ID string**: `pp_stripe_stripe` (use this in `initiatePaymentSession()`)
- **Options shape**: `{ apiKey, webhookSecret, capture, automatic_payment_methods, payment_description, oxxoExpiresDays }`
- **Webhook endpoint**: `{server_url}/hooks/payment/stripe` (Medusa listens automatically)
- **Webhook events**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.amount_capturable_updated`
- **Conditional loading**: Stripe provider only registered if `STRIPE_API_KEY` env var exists (using spread operator)

Sources:
- [Payment Module Provider - Medusa Documentation](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider)
- [Stripe Module Provider - Medusa Documentation](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe)
- [Checkout Step 4: Choose Payment Provider](https://docs.medusajs.com/resources/storefront-development/checkout/payment)
- [Use Stripe's Payment Element in the Next.js Starter Storefront](https://docs.medusajs.com/resources/nextjs-starter/guides/customize-stripe)
- [Payment Steps in Checkout Flow](https://docs.medusajs.com/resources/commerce-modules/payment/payment-checkout-flow)