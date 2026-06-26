Perfect. Now I have all the information needed. Let me compile the comprehensive response:

## Medusa v2 Storefront-Backend Connection (create-medusa-app)

### Monorepo Structure

The `create-medusa-app` CLI creates a monorepo with the following structure:

```
my-medusa-store/
├── apps/
│   ├── backend/          # Medusa v2 backend
│   └── storefront/       # Next.js starter storefront
├── package.json
└── pnpm-workspace.yaml
```

---

### Environment Variables (`.env.local`)

**Location:** `apps/storefront/.env.local`

**Template:**
```env
# Medusa Backend API Configuration
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_<your-publishable-key>

# Storefront URL (for revalidation, OG tags, etc.)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Stripe integration
NEXT_PUBLIC_STRIPE_KEY=pk_test_<your-stripe-key>

# Revalidation secret for Next.js ISR
REVALIDATE_SECRET=<random-string>
```

**Notes on vars:**
- All `NEXT_PUBLIC_*` vars are browser-accessible (Next.js convention)
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to the backend server
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is used as the `x-publishable-api-key` header in Store API requests
- `NEXT_PUBLIC_BASE_URL` is used for canonical URLs and OG metadata
- `NEXT_PUBLIC_DEFAULT_REGION` is not a standard env var; regions are determined via the `_medusa_country_code` cookie instead

---

### Publishable API Key: Creation & Sales Channel Linking

#### What It Is

A publishable API key is a **client-side credential** that scopes requests to one or more sales channels. It's passed in the `x-publishable-api-key` request header (or configured in the JS SDK).

**Key property:** When a publishable key is included in a request header, Medusa automatically infers the associated sales channels via `req.publishable_key_context.sales_channel_ids`.

#### Generation During Seed

During the seed process, the publishable API key is **created via Admin API** (not auto-generated). Example workflow in a seed script:

```typescript
// Create a publishable API key via Admin API
const response = await axios.post(
  `${MEDUSA_BACKEND_URL}/admin/api-keys`,
  {
    title: "Storefront Key",
    type: "publishable",
  },
  {
    headers: {
      Authorization: `Bearer ${ADMIN_API_TOKEN}`, // Seed scripts use admin token
    },
  }
)

const publishableKey = response.data.api_key

// Add sales channel to the key's scope
await axios.post(
  `${MEDUSA_BACKEND_URL}/admin/api-keys/${publishableKey.id}/sales-channels`,
  {
    add: ["sc_default"], // Array of sales channel IDs
  },
  {
    headers: {
      Authorization: `Bearer ${ADMIN_API_TOKEN}`,
    },
  }
)
```

Or use the Medusa **Sales Channel Module** service in your seed script:

```typescript
// Get default sales channel
const salesChannelModuleService = container.resolve("salesChannelModuleService")
const defaultChannel = await salesChannelModuleService.listSalesChannels({
  name: "Default Sales Channel",
})

// Use it to associate products/resources
const products = await createProductsWorkflow(container).run({
  input: {
    products: [
      {
        title: "Product Name",
        sales_channels: [{ id: defaultChannel[0].id }],
      },
    ],
  },
})
```

#### Linking to Sales Channel

A publishable API key is scoped to sales channels via the Admin API route:

```
POST /admin/api-keys/{id}/sales-channels
{
  "add": ["sc_123", "sc_456"]
}
```

Once linked, any Store API request with that publishable key will:
- Only return data (products, variants, prices) associated with those sales channels
- Automatically filter inventory, pricing, and availability per channel

---

### JS SDK Configuration

The storefront initializes the SDK using the environment variables:

```typescript
// src/lib/sdk.ts (or similar)
import Medusa from "@medusajs/js-sdk"

const SDK = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

export default SDK
```

The SDK automatically passes the publishable key in the `x-publishable-api-key` header for all Store API requests.

---

### Country Code & Region Resolution

#### How It Works

**Current Approach (Medusa v2.14.0+):** Country codes are stored in a **cookie-based system**, not URL path parameters. The original `[countryCode]` dynamic route is deprecated in favor of middleware-driven country code resolution.

#### Middleware (src/middleware.ts)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getCountryCode } from "@/lib/data/cookies"

export async function middleware(request: NextRequest) {
  // Get country code from cookie, geolocation header, or default
  const countryCode = await getCountryCode(request)
  
  const response = NextResponse.next()
  
  // Set the country code cookie (1-year expiration)
  response.cookies.set("_medusa_country_code", countryCode, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
  
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

#### Cookie Utilities (src/lib/data/cookies.ts)

```typescript
import { cookies as nextCookies } from "next/headers"

export const COUNTRY_CODE_COOKIE_NAME = "_medusa_country_code"

export const getCountryCode = async (): Promise<string | null> => {
  try {
    const cookies = await nextCookies()
    return cookies.get(COUNTRY_CODE_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

export const setCountryCode = async (countryCode: string) => {
  const cookies = await nextCookies()
  cookies.set(COUNTRY_CODE_COOKIE_NAME, countryCode, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}
```

#### Region Context Provider

Regions are managed via a **React Context** (not URL routing):

```typescript
// src/context/region-provider.tsx
import { createContext, useContext } from "react"
import { sdk } from "@/lib/sdk"

const RegionContext = createContext<{ region: Region; setRegion: (r: Region) => void } | undefined>(undefined)

export function RegionProvider({ children }) {
  const [region, setRegion] = useState<Region | null>(null)

  useEffect(() => {
    const countryCode = await getCountryCode()
    const fetchedRegion = await sdk.store.region.retrieve(countryCode)
    setRegion(fetchedRegion)
    localStorage.setItem("region_id", fetchedRegion.id)
  }, [countryCode])

  return (
    <RegionContext.Provider value={{ region, setRegion }}>
      {children}
    </RegionContext.Provider>
  )
}

export const useRegion = () => {
  const context = useContext(RegionContext)
  if (!context) throw new Error("useRegion must be used within RegionProvider")
  return context
}
```

#### Region Resolution Flow

1. Middleware detects/sets country code in `_medusa_country_code` cookie
2. `getCountryCode()` retrieves the cookie value
3. SDK calls `sdk.store.region.retrieve(countryCode)` to fetch region details (ID, name, currency, tax rates, etc.)
4. Region is stored in React Context and localStorage
5. Components access region via `useRegion()` hook for pricing, availability, and checkout

#### Legacy Route Structure (If Using [countryCode])

If your storefront still uses dynamic `[countryCode]` routes, the file structure would be:

```
src/app/
├── [countryCode]/
│   ├── products/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── checkout/
│   │   └── page.tsx
│   └── layout.tsx
└── layout.tsx
```

However, **this is being phased out** in favor of cookie-based routing. See [Remove Country Code Prefix in Next.js Starter Storefront](https://docs.medusajs.com/resources/nextjs-starter/guides/remove-country-code) for migration guidance.

---

### CORS Configuration (Backend)

In `apps/backend/medusa-config.ts`, enable storefront requests:

```typescript
export default defineConfig({
  http: {
    storeCors: "http://localhost:3000,http://localhost:8000",
    // Add production URL in production
  },
})
```

---

### Summary: Data Flow

```
Storefront (.env.local)
  ↓
NEXT_PUBLIC_MEDUSA_BACKEND_URL, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  ↓
JS SDK Configuration (src/lib/sdk.ts)
  ↓
SDK Requests → Backend with x-publishable-api-key header
  ↓
Backend Infers Sales Channel via publishable_key_context
  ↓
Filtered Data Returned (region-specific prices, inventory, etc.)
  ↓
Region React Context + localStorage
  ↓
Components (useRegion hook) Display Region-Specific Content
```

---

### Sources

- [Next.js Starter Storefront - Medusa Documentation](https://docs.medusajs.com/resources/nextjs-starter)
- [Use a Publishable API Key in the Storefront - Medusa Documentation](https://docs.medusajs.com/resources/storefront-development/publishable-api-keys)
- [Connect Your Storefront to Medusa - Medusa Documentation](https://docs.medusajs.com/resources/storefront-development/tips)
- [Publishable API Keys with Sales Channels - Medusa Documentation](https://docs.medusajs.com/resources/commerce-modules/sales-channel/publishable-api-keys)
- [Remove Country Code Prefix in Next.js Starter Storefront - Medusa Documentation](https://docs.medusajs.com/resources/nextjs-starter/guides/remove-country-code)
- [Store Selected Region in Storefront - Medusa Documentation](https://docs.medusajs.com/resources/storefront-development/regions/store-retrieve-region)
- [Region React Context in Storefront - Medusa Documentation](https://docs.medusajs.com/resources/storefront-development/regions/context)
- [create-medusa-app CLI Tool - Medusa Documentation](https://docs.medusajs.com/resources/create-medusa-app)
- [Seed Data with Custom CLI Script - Medusa Documentation](https://docs.medusajs.com/learn/fundamentals/custom-cli-scripts/seed-data)