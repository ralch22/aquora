Now I have all the information needed. Here's the complete guide for custom Store API routes in Medusa v2:

---

## Custom Store API Routes in Medusa v2

### File Path Structure

Create your custom store route at:
```
src/api/store/{resource}/{nested-path}/route.ts
```

**Example:** `src/api/store/assistant/route.ts` → accessible at `/store/assistant`

### Export Signature

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Handler code
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Handler code
}
```

Other HTTP methods: DELETE, PUT, PATCH follow the same pattern.

### Reading JSON Body

```typescript
// Access parsed JSON automatically via req.body
const { property_name } = req.body
```

The framework automatically parses `Content-Type: application/json` requests and attaches the object to `req.body`.

### Accessing Modules via Query Graph (Recommended)

```typescript
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Resolve the Query from container
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  // Query products using the query graph
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description"],
    filters: { handle: "my-product" },
  })
  
  res.json({ products })
}
```

**Alternative string key:** `req.scope.resolve("query")` also works.

### Minimal Working Example

**File:** `src/api/store/products/search/route.ts`

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { search_term, limit = 10 } = req.body
  
  if (!search_term) {
    return res.status(400).json({ error: "search_term is required" })
  }
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description"],
    filters: { title: { $ilike: `%${search_term}%` } },
  })
  
  return res.json({
    results: products.slice(0, limit),
    total: products.length,
  })
}

// Disable CORS override if needed (inherit from medusa-config)
// export const CORS = false
```

**Usage:**
```bash
curl -X POST http://localhost:9000/store/products/search \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: pk_..." \
  -d '{"search_term": "pool", "limit": 5}'
```

### CORS Configuration

**File:** `medusa-config.ts`

```typescript
import { defineConfig } from "@medusajs/framework"

export default defineConfig({
  projectConfig: {
    http: {
      storeCors: "http://localhost:8000, http://my-storefront.com",
      adminCors: "http://localhost:7001",
    },
  },
  // ... other config
})
```

- `storeCors`: Origins allowed to access `/store/*` routes
- Multiple origins separated by commas
- Set via `STORE_CORS` environment variable or directly in config

**Disable CORS per route:**
```typescript
export const CORS = false
```

### Key Points

- **Query is the primary access pattern** for API routes (not direct module resolution). Use `query.graph()` to fetch any registered data model.
- **req.body** is automatically parsed JSON; no manual `JSON.parse()` needed.
- **req.scope** is the Medusa container; use `.resolve()` to access registered services/utilities.
- Store routes inherit CORS from `medusa-config.ts` `storeCors` setting.
- Requires `x-publishable-api-key` header (scopes to sales channel) in production store routes.

Sources:
- [4.6. API Routes - Medusa Documentation](https://docs.medusajs.com/learn/fundamentals/api-routes)
- [3.2. Medusa Container - Medusa Documentation](https://docs.medusajs.com/learn/fundamentals/medusa-container)
- [3.6.9. Handling CORS in API Routes - Medusa Documentation](https://docs.medusajs.com/v2/advanced-development/api-routes/cors)
- [3.4.7. Query Context - Medusa Documentation](https://docs.medusajs.com/learn/fundamentals/module-links/query-context)
- [Medusa V2 Store API Reference](https://docs.medusajs.com/api/store)