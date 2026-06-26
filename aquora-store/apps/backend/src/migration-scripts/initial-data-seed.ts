import { MedusaContainer } from "@medusajs/framework";

// Default Medusa demo seed intentionally disabled for Aquora.
// All store data (UAE/AED region, 12 categories, 96 products) is seeded by
// src/scripts/aquora-seed.ts via: medusa exec ./src/scripts/aquora-seed.ts
export default async function initial_data_seed(_args: {
  container: MedusaContainer;
}) {
  // no-op
}
