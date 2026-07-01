import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { ASSISTANT_MODULE } from "../modules/assistant"

// Assisted-conversion attribution (Phase 3). When an order is placed, if checkout stamped the
// Ask-Aqua visitor id (aq_vid) onto the cart — which propagates to order.metadata — mark that
// visitor's most recent Ask-Aqua conversation as converted (last-touch, within a 24h window).
// Best-effort + wrapped: attribution can never block or break the order flow.
const WINDOW_MS = 24 * 60 * 60 * 1000

export default async function assistantAttributionSubscriber({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderService = container.resolve(Modules.ORDER)
    const order: any = await orderService.retrieveOrder(event.data.id)
    const aqVid = (order?.metadata?.aq_vid as string) || ""
    if (!aqVid || aqVid === "anon") return

    const assistant: any = container.resolve(ASSISTANT_MODULE)
    const recent = await assistant.listAssistantSessions(
      { visitor_id: aqVid },
      { order: { created_at: "DESC" }, take: 1 }
    )
    const last = recent?.[0]
    if (!last || last.converted) return
    if (Date.now() - new Date(last.created_at).getTime() > WINDOW_MS) return

    // Mark the whole conversation (all its turns share conversation_id) as converted.
    await assistant.updateAssistantSessions({
      selector: { conversation_id: last.conversation_id },
      data: { converted: true, order_id: event.data.id },
    })
  } catch {
    // best-effort; attribution must never block the order
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
