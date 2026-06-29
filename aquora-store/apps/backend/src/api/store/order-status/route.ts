import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { lookupOrderStatus } from "../../../lib/order-status";

// Phase 4 (support): customer-facing order-status lookup. GET ?order=<number>&email=<email>.
// Read-only; gated on order# + matching email so it never exposes another customer's order.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const order = String(req.query.order || "");
  const email = String(req.query.email || "");
  if (!order || !email) {
    res.status(400).json({ error: "Provide both 'order' (number) and 'email'." });
    return;
  }
  const result = await lookupOrderStatus(graph, { order, email });
  res.json(result);
}
