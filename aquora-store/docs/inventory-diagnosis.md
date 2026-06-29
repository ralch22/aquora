# Inventory "capped at 1" — root-cause diagnosis (WS4-PR1)

> **Status:** Investigation only. **No live stock was changed by this PR** and no
> functional code was modified. This document traces where inventory levels are
> set (backend import) and how the storefront reads them (cart/PDP gating), pins
> the most likely root cause of the cap-at-1 symptom, and recommends a safe,
> owner-gated remediation path for **WS4-PR2**.

---

## 1. Symptom

Most products in production expose `inventory_quantity = 1` on their single
variant. Because the storefront caps the buyable quantity at the remaining
tracked stock, the **cart line quantity selector only offers "1"**, so customers
cannot buy multiples of high-ticket equipment.

The cap is **not** on the PDP stepper (that allows up to 99). It is the **cart
line item** selector that is hard-capped at the variant's `inventory_quantity`.
See the read-path trace in §3.

---

## 2. What the code actually writes (backend)

The catalogue is created by the import script
`aquora-store/apps/backend/src/scripts/import-catalog.ts`:

- **Every variant is created with `manage_inventory: true`** — so the storefront
  treats stock as *tracked* and gates purchasable quantity on the counted level
  (`import-catalog.ts:189`):

  ```ts
  variants: [{ title: "Standard", sku, manage_inventory: true, options: { Type: "Standard" }, prices: [...] }]
  ```

- **Inventory levels are written with `stocked_quantity: 100`** at the
  "Dubai Distribution Centre" stock location, in batches of 1000
  (`import-catalog.ts:198-205`):

  ```ts
  const { data: invItems } = await query.graph({ entity: "inventory_item", fields: ["id"], pagination: { take: 20000 } });
  for (let i = 0; i < invItems.length; i += 1000) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: invItems.slice(i, i + 1000).map((it) => ({
        location_id: stockLocation.id, stocked_quantity: 100, inventory_item_id: it.id })) },
    });
  }
  ```

- No variant carries `allow_backorder: true` (the field is never set, so it
  defaults to `false`).

The now-deleted earlier seed `aquora-seed.ts` (96-product baseline, git commit
`73c845b`) likewise used `manage_inventory: true` with `stocked_quantity: 500`.

**Conclusion: no code path in the repo ever writes `inventory_quantity = 1`.**
The script writes 100 (and the older seed wrote 500). Therefore **production data
has diverged from the committed import script** — the value of `1` was introduced
by *how/whether the inventory step ran in production*, not by the current source.

---

## 3. How the storefront reads inventory (the read path that produces the cap)

### 3a. Fields fetched
- PLP/PDP list query requests the computed field
  `+variants.inventory_quantity` (`apps/storefront/src/lib/data/products.ts:72-73`).
- Cart query requests
  `+items.variant.inventory_quantity, +items.variant.manage_inventory, +items.variant.allow_backorder`
  (`apps/storefront/src/lib/data/cart.ts:27`).

### 3b. PDP add-to-cart gating — `apps/storefront/src/modules/products/components/product-actions/index.tsx`
`inStock` (lines 110-131) is the gate:
1. `!manage_inventory` → always purchasable.
2. `allow_backorder` → always purchasable.
3. `manage_inventory && inventory_quantity > 0` → purchasable.
4. otherwise → "Out of stock".

The PDP **stepper itself** allows 1–99 (`Math.min(99, q + 1)`, lines 238-246) —
it does *not* read `inventory_quantity`. So on the PDP a shopper can pick e.g. 5,
but Medusa rejects an add that exceeds the tracked stock of a managed,
non-backorder variant, so the effective ceiling is still 1.

### 3c. Cart line cap — `apps/storefront/src/modules/cart/components/item/index.tsx` (the visible cap)
```ts
const CAP = 99
const inStock =
  !v?.manage_inventory || v?.allow_backorder
    ? CAP
    : Math.max(0, v?.inventory_quantity ?? 0)     // managed + no backorder ⇒ = inventory_quantity
const maxQuantity = Math.max(item.quantity, Math.min(inStock, CAP))
```
The `<CartItemSelect>` then renders options `1 … maxQuantity`
(`Array.from({ length: maxQuantity })`, lines 125-136). For a managed variant
with `inventory_quantity = 1` and no backorder, `maxQuantity = 1`, so the
**dropdown offers only "1"** — the exact reported symptom.

### 3d. Field that actually gates the stepper
**`inventory_quantity`** (a Medusa-computed field = stocked − reserved across
inventory levels at stock locations linked to the request's sales channel),
**combined with `manage_inventory = true` and `allow_backorder = false`.**
Flipping any one of these three breaks the cap (see §5).

> Note: `apps/backend/src/lib/product-lookup.ts:64-67` already documents that the
> `inventory_quantity` link "does not resolve reliably through this graph
> (returns 0)" in the agent/compare hydration path — corroborating that
> inventory-level resolution in this deployment is fragile.

---

## 4. Root cause

**Confirmed:** the cap-at-1 is driven by the storefront gating
`manage_inventory = true` + `allow_backorder = false` variants on the computed
`inventory_quantity`, and production reports `inventory_quantity = 1` for most
variants — **a value the import script never writes (it writes 100).** Committed
source and production data have diverged.

**Most likely mechanism for the literal `1` (to be confirmed by the §6 audit
against the live DB):**

1. **An earlier/partial import set the levels to 1** — the catalogue was
   populated before `import-catalog.ts` reached its current `stocked_quantity: 100`
   form (or by an interim script/admin CSV import that defaulted to 1), and the
   inventory step was never re-run to overwrite the levels.
   `createInventoryLevelsWorkflow` **creates** levels; on variants that already
   had a level of 1, a re-run does not lower-or-raise an existing level to 100,
   so the stale `1` persists. **(Primary hypothesis.)**
2. **The inventory step partially ran** — products created across multiple import
   passes, but the inventory-levels loop only completed for a subset, leaving the
   rest at a fallback value.
3. **Sales-channel / stock-location linkage** — if levels exist at a location not
   linked to the storefront's sales channel, the computed `inventory_quantity`
   would not reflect the 100; this typically yields `0`, not `1`, so it is a
   weaker explanation for the exact value `1` but should be ruled out in the audit.

The audit in §6 distinguishes (1)/(2) from (3) by reporting the histogram of
`stocked_quantity` values and the count of variants with vs. without a level at
the Dubai location.

---

## 5. Remediation options for WS4-PR2 (owner-gated decision)

Aquora is largely a distributor / made-to-order business, so the honest models are:

### Option A — Made-to-order (recommended default): `manage_inventory = false`
Set affected variants to `manage_inventory = false`. The storefront then treats
them as always purchasable at any quantity (cart `inStock = CAP = 99`), and the
existing **honest** messaging already handles it: the PDP shows
*"Available to order — we'll confirm your dispatch date"* and the cart shows
*"Available to order"* (no fabricated stock numbers). This requires **no
storefront change** — the gating already supports it.

- **Pros:** honest for distributor/made-to-order gear; no invented counts;
  unblocks qty > 1 immediately; smallest, safest write.
- **Cons:** loses the "In stock — ships within 48 hours" and "Only N left" signals
  for items that genuinely are stocked.

### Option B — Real stock levels: upsert `stocked_quantity` at the Dubai location
Keep `manage_inventory = true` and write a real `stocked_quantity` (e.g. an
owner-confirmed default such as 100) by **updating the existing inventory levels**
(not just `create`, which is what left the stale `1`).

- **Pros:** preserves the "In stock / ships in 48h / Only N left" honest signals.
- **Cons:** requires a number; using a blanket default (100) is only honest if the
  business genuinely holds/quickly replenishes that stock — otherwise it implies
  stock that may not exist (borderline fabricated-stock; see invariant #2).

### Option C — Hybrid
Owner classifies genuinely-stocked SKUs (Option B with real counts) vs.
made-to-order SKUs (Option A). Most defensible but needs per-SKU input.

**Recommendation:** default to **Option A** (made-to-order, `manage_inventory =
false`) for the affected variants — it is the only option that unblocks multiples
*without asserting any stock number*, honoring the "no fabricated stock"
invariant. Switch specific SKUs to Option B only where the owner confirms real,
held stock. A blanket Option B with `stocked_quantity: 100` should be avoided
unless the owner confirms it is truthful.

> `allow_backorder = true` is a third lever that also lifts the cap while keeping
> `manage_inventory = true`, but it implies "we'll backorder it," which is
> messaging the storefront does not currently distinguish from in-stock — prefer
> A or B.

---

## 6. Recommended next step — read-only audit (for WS4-PR2)

Before any bulk write, confirm the exact distribution against the **live Cloud SQL
DB**. The following read-only Medusa script (zero writes) produces the breakdown
the remediation needs. **It is intentionally not committed as a runnable file in
this investigation-only PR** — paste it into
`apps/backend/src/scripts/audit-inventory.ts` in WS4-PR2 and run via
`medusa exec ./src/scripts/audit-inventory.ts`:

```ts
import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// READ-ONLY. Reports variant inventory state. No writes.
export default async function auditInventory({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // 1) manage_inventory + allow_backorder distribution across variants
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "manage_inventory", "allow_backorder", "inventory_items.inventory_item_id"],
    pagination: { take: 50000 },
  });

  let managed = 0, unmanaged = 0, backorder = 0;
  for (const v of variants as any[]) {
    v.manage_inventory ? managed++ : unmanaged++;
    if (v.allow_backorder) backorder++;
  }

  // 2) stocked_quantity histogram from inventory levels (the real on-DB numbers)
  const { data: levels } = await query.graph({
    entity: "inventory_level",
    fields: ["stocked_quantity", "reserved_quantity", "location_id", "inventory_item_id"],
    pagination: { take: 50000 },
  });
  const hist: Record<string, number> = {};
  let withLevel = 0;
  for (const l of levels as any[]) {
    withLevel++;
    const k = String(l.stocked_quantity);
    hist[k] = (hist[k] || 0) + 1;
  }

  console.log(JSON.stringify({
    variants_total: variants.length,
    manage_inventory_true: managed,
    manage_inventory_false: unmanaged,
    allow_backorder_true: backorder,
    inventory_levels_total: levels.length,
    variants_with_level: withLevel,
    variants_without_level: variants.length - withLevel,
    stocked_quantity_histogram: hist,   // expect a large bucket at "1" if hypothesis #1 holds
  }, null, 2));
}
```

**Expected confirmation:** a large `stocked_quantity_histogram["1"]` bucket (with
few/none at `"100"`) confirms hypothesis #1 (stale levels of 1 that the
`stocked_quantity: 100` import never overwrote). A large `variants_without_level`
count instead points to hypothesis #2/#3.

The script reads `DATABASE_URL` / Cloud SQL config from the existing Medusa env —
**no credentials are hardcoded or printed.**

---

## 7. Exact files & scripts involved

| Concern | File | Lines |
| --- | --- | --- |
| Writes `manage_inventory: true` per variant | `apps/backend/src/scripts/import-catalog.ts` | 189 |
| Writes inventory levels `stocked_quantity: 100` | `apps/backend/src/scripts/import-catalog.ts` | 198–205 |
| Earlier (deleted) seed wrote `stocked_quantity: 500` | `apps/backend/src/scripts/aquora-seed.ts` (git `73c845b`) | 288–313 |
| Note: `inventory_quantity` link unreliable via graph | `apps/backend/src/lib/product-lookup.ts` | 64–67 |
| PDP add-to-cart `inStock` gate | `apps/storefront/src/modules/products/components/product-actions/index.tsx` | 110–142 |
| Cart line cap (the visible "max = 1") | `apps/storefront/src/modules/cart/components/item/index.tsx` | 53–63, 125–136 |
| Fetches `+variants.inventory_quantity` | `apps/storefront/src/lib/data/products.ts` | 72–73 |
| Fetches cart variant inventory fields | `apps/storefront/src/lib/data/cart.ts` | 27 |
| Remediation target (WS4-PR2) | `apps/backend/src/scripts/fix-inventory.ts` (to be created) | — |

---

## 8. TL;DR

- **Root cause:** storefront caps quantity at `inventory_quantity` for
  `manage_inventory = true` + non-backorder variants; production reports
  `inventory_quantity = 1`, a value the committed `import-catalog.ts` never writes
  (it writes 100). Committed source and production data diverged — most likely a
  **stale/partial earlier inventory import of `1` that the later
  `stocked_quantity: 100` step never overwrote** (`create`, not update).
- **Field that gates the stepper:** `inventory_quantity` (+ `manage_inventory` +
  `allow_backorder`).
- **Safe fix (WS4-PR2):** prefer **`manage_inventory = false`** (made-to-order,
  honest "available to order", no invented counts) for affected variants; use real
  `stocked_quantity` only where the owner confirms genuine stock. Run the §6
  read-only audit first to confirm the distribution before any bulk write.
- **This PR:** documentation only — no live stock changed, no functional code
  modified.
</content>
</invoke>
