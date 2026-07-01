import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Stripe is added ONLY when STRIPE_API_KEY is present, so a no-key deploy stays on the
// default in-app manual provider (pp_system_default) and checkout keeps working.
const paymentProviders: any[] = []
if (process.env.STRIPE_API_KEY) {
  paymentProviders.push({
    resolve: '@medusajs/payment-stripe',
    id: 'stripe',
    options: {
      apiKey: process.env.STRIPE_API_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      // Create PaymentIntents with automatic_payment_methods so Apple Pay / Google Pay
      // (via the Express Checkout Element) are eligible alongside cards.
      automaticPaymentMethods: true,
    },
  })
}

const modules: any[] = []
if (paymentProviders.length) {
  modules.push({
    resolve: '@medusajs/medusa/payment',
    options: { providers: paymentProviders },
  })
}

// Custom product-reviews module (moderation-first, verified-purchase aware).
modules.push({ resolve: './src/modules/review' })

// Custom product Q&A module (owner-answered, moderation-first).
modules.push({ resolve: './src/modules/qa' })

// Ask-Aqua conversation persistence (Phase 3 insights) — records every assistant turn
// fire-and-forget for transcripts + assisted-conversion attribution.
modules.push({ resolve: './src/modules/assistant' })

// Newsletter capture (owned marketing list) — footer signup writes here via /store/newsletter.
modules.push({ resolve: './src/modules/newsletter' })

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  ...(modules.length ? { modules } : {}),
})
