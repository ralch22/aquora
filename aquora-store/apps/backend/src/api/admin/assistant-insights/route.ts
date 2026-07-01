import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ASSISTANT_MODULE } from "../../../modules/assistant"

// GET /admin/assistant-insights — Ask-Aqua conversational insights (admin-session auth).
// Aggregates the assistant_session table: conversation volume, assisted-conversion rate,
// intent mix (by tools used), and FAQ-gaps (searches that returned zero products). Read-only.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service: any = req.scope.resolve(ASSISTANT_MODULE)
    // Bounded recent window — most-recent 5000 turns.
    const rows: any[] = await service.listAssistantSessions(
      {},
      { order: { created_at: "DESC" }, take: 5000 }
    )

    const conversations = new Set<string>()
    const convertedConversations = new Set<string>()
    let aiTurns = 0
    const intents = {
      product_search: 0,
      recommendations: 0,
      product_detail: 0,
      order_status: 0,
      visual_search: 0,
      no_tool: 0,
    }
    const faqGaps: { message: string | null; at: string }[] = []

    for (const r of rows) {
      if (r.conversation_id) conversations.add(r.conversation_id)
      if (r.converted && r.conversation_id) convertedConversations.add(r.conversation_id)
      if (r.ai) aiTurns++

      const tools: string[] = Array.isArray(r.tools_used) ? r.tools_used : []
      if (!tools.length) intents.no_tool++
      if (tools.includes("search_products")) intents.product_search++
      if (tools.some((t) => t === "recommend_for_you" || t === "recommend_complementary")) intents.recommendations++
      if (tools.includes("get_product")) intents.product_detail++
      if (tools.includes("get_order_status")) intents.order_status++
      if (tools.includes("visual_search")) intents.visual_search++

      // FAQ-gap: the agent searched the catalogue but surfaced nothing.
      const sugg = Array.isArray(r.suggestions) ? r.suggestions : []
      if (tools.includes("search_products") && sugg.length === 0 && r.message) {
        if (faqGaps.length < 30) faqGaps.push({ message: r.message, at: r.created_at })
      }
    }

    const totalConversations = conversations.size
    const assistedConversionRate = totalConversations
      ? convertedConversations.size / totalConversations
      : 0

    res.json({
      totalTurns: rows.length,
      aiTurns,
      totalConversations,
      convertedConversations: convertedConversations.size,
      assistedConversionRate,
      intents,
      faqGaps,
      windowNote: rows.length >= 5000 ? "showing the most recent 5000 turns" : null,
    })
  } catch (e) {
    res.status(500).json({ error: (e as Error)?.message || "Failed to load insights" })
  }
}
