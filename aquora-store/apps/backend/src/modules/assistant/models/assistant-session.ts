import { model } from "@medusajs/framework/utils"

// One persisted Ask-Aqua turn. Written FIRE-AND-FORGET from the assistant route AFTER the
// reply is sent, so recording a conversation can never block, slow, or break the shopper.
// `conversation_id` groups turns into a full transcript; `visitor_id` (the aq_vid cookie) is
// the join key that later ties an order back to an assistant-assisted session. Content is
// already PII-masked upstream. `converted`/`order_id` are set later by the order.placed join.
const AssistantSession = model.define("assistant_session", {
  id: model.id().primaryKey(),
  conversation_id: model.text(),
  visitor_id: model.text(),
  customer_id: model.text().nullable(),
  message: model.text().nullable(), // user text / voice transcript
  reply: model.text().nullable(), // assistant reply text
  tools_used: model.json().nullable(), // string[] of tool names invoked this turn
  suggestions: model.json().nullable(), // [{ handle, title, price, variant_id }]
  cta: model.text().nullable(), // e.g. "go_to_checkout"
  had_image: model.boolean().default(false),
  had_audio: model.boolean().default(false),
  ai: model.boolean().default(false), // did Gemini answer (vs graceful fallback)
  converted: model.boolean().default(false), // set true by the order.placed attribution join
  order_id: model.text().nullable(), // the attributed order (assisted conversion)
})

export default AssistantSession
