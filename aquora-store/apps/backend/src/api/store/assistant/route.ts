import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { visualSearch } from "../../../lib/vision-search";
import { getAccessToken } from "../../../lib/gcp-token";
import { retailPredict, retailSearch, writeUserEvent } from "../../../lib/retail";
import { hydrateProducts, type Card } from "../../../lib/product-lookup";
import { COMPLEMENTARY } from "../../../lib/complementary";
import { lookupOrderStatus } from "../../../lib/order-status";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const LOCATION = process.env.GCP_LOCATION || "global";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_STEPS = 4; // bound the agentic tool loop (cost + latency)

const SYSTEM = `You are "Aqua", the expert AI shopping agent for Aquora — a premium UAE/GCC supplier of pool, spa, pond and fountain equipment.
Your job: help customers find AND buy the right equipment, end to end. Be confident, expert, concise and practical; UAE English; prices in AED.

Tools:
- search_products: find catalogue items by the key product nouns (e.g. "variable speed pump", "sand filter", "LED light"). ALWAYS search before saying something isn't available — the catalogue has ~6,000 items. Pass max_price to cap the budget.
- get_product: get accurate price, stock and details for one product by its handle before recommending it specifically or comparing.
- recommend_complementary: given a product handle, get items frequently used with it (e.g. a filter for a pump) to cross-sell.
- recommend_for_you: personalised picks for this shopper from their history. Use for open-ended "what do you recommend / what's popular" asks; if it returns nothing, fall back to search_products.
- visual_search: when the customer attaches a photo, identify the equipment and call search_products with keywords; you may also call visual_search.

Support: you also help after the sale.
- ORDER STATUS: ask for the order number AND the email used on the order, then call get_order_status. Never reveal order details without both.
- SHIPPING: free UAE delivery on orders over AED 500; dispatched across the Emirates & GCC.
- RETURNS / WARRANTY: products are genuine with manufacturer warranty; for the full returns terms point to /legal/returns and /legal/shipping. Never invent specific policy terms.
- ESCALATION: for anything you can't resolve, offer to connect the customer with the team by email (hello@aquora.ae) or WhatsApp.

Sizing & guidance:
- SIZING: pool equipment is sized from water VOLUME = length × width × average depth (m³). For a circulation pump, aim to turn the whole pool over in ~6 hours, so required flow (m³/h) ≈ volume ÷ 6; the filter must be rated for at least that flow. If a customer gives you their pool size, do this calculation and recommend matching products. For exact figures point them to the free sizing calculator at /pool-sizing-guide.
- WATER CHEMISTRY: for "my pool is green / cloudy / has algae / stains" or balancing questions, give the practical fix — test, then balance alkalinity & pH (7.2–7.6), then chlorinate/shock, then algaecide if needed, and run the filter — and recommend the matching chemicals (chlorine, pH balancers, algaecide, clarifier, test kits). Point them to the free dosing calculator (/pool-dosing-calculator) for exact chemical amounts, or the problem solver (/pool-problem-solver) for step-by-step fixes. Always tell them to follow product labels, add chemicals in stages and re-test. The free tools, guides and troubleshooting all live under Pool Care (/pool-care).
- On each product page customers can read verified reviews and ask our team a question (Q&A) — mention this when it helps build confidence.

Rules:
- Ground EVERY product name, price and stock claim in a tool result. NEVER invent SKUs, prices, stock, order details or policy terms.
- You CANNOT add items to the cart or take payment yourself. Present the products — the interface shows an "Add to cart" button on each card. When the customer is ready to check out, tell them you've taken them to checkout.
- You are given the customer's current cart. Suggest complementary items and don't re-recommend what's already in it.
- Compare options on price, suitability and stock when asked. Keep replies under ~130 words. If nothing fits after searching, offer a free consultation.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "search_products",
        description:
          "Search the live Aquora catalogue (Google Retail AI) for products matching a query. Returns products with AED price, stock and handle. Use the key product nouns.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Key product nouns, e.g. 'variable speed pump'" },
            category: { type: "string", description: "Optional catalogue category name to scope the search, e.g. 'Pool Pumps', 'Pool heaters', 'Pool chlorinators'. Only set it when the request is clearly about one category." },
            max_price: { type: "number", description: "Optional AED price ceiling" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_product",
        description:
          "Get full details (AED price, stock, description) for ONE product by its handle. Call before recommending a specific item or comparing prices.",
        parameters: { type: "object", properties: { handle: { type: "string" } }, required: ["handle"] },
      },
      {
        name: "recommend_complementary",
        description:
          "Given a product handle the customer is interested in, return products frequently used together (e.g. a filter for a pump). Use to cross-sell.",
        parameters: { type: "object", properties: { handle: { type: "string" } }, required: ["handle"] },
      },
      {
        name: "recommend_for_you",
        description:
          "Return products personalised for THIS shopper from Google Retail Recommendations (their browsing + purchase history). Use for open-ended asks like 'what do you recommend' or 'what's popular' when there's no specific product in mind. Returns an empty list when no personalised recommendations exist yet — then use search_products instead.",
        parameters: { type: "object", properties: {}, required: [] },
      },
      {
        name: "visual_search",
        description: "Find products matching the customer's attached photo. Call with no arguments when an image is provided.",
        parameters: { type: "object", properties: {}, required: [] },
      },
      {
        name: "get_order_status",
        description: "Look up a customer's order. REQUIRES both the order number and the email used on the order. Returns the order status, payment + fulfilment state and items.",
        parameters: { type: "object", properties: { order: { type: "string", description: "The order number" }, email: { type: "string", description: "The email used on the order" } }, required: ["order", "email"] },
      },
    ],
  },
];

// Whitelist a model-supplied facet value (mirrors search/route.ts sanitizeFacet) before it
// ever reaches a Retail filter literal — prevents filter injection.
function sanitizeFacet(s: string): string {
  return String(s || "").replace(/[^\p{L}\p{N}\s\-_.&/]/gu, "").trim();
}

const STOP = new Set(["pool","spa","the","for","with","you","have","need","want","best","good","show","find","please","some","this","that","your","our","and","any","what","which","looking","like","would"]);

function wantsCheckout(msg: string): boolean {
  return /\b(check ?out|proceed to (checkout|payment|pay)|take me to (checkout|payment|pay|cart)|ready to (pay|buy|order|check ?out)|place (my )?order|complete (my )?(order|purchase)|go to (checkout|cart))\b/i.test(msg || "");
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as {
    message?: string;
    imageBase64?: string;
    mimeType?: string;
    audioBase64?: string;
    audioMimeType?: string;
    history?: any[];
    cart?: { title?: string; variant_id?: string; handle?: string }[];
    v?: string;
  };
  const message = (body.message || "").toString().trim();
  const imageBase64 = (body.imageBase64 || "").toString().replace(/^data:[^,]+,/, "");
  const mimeType = (body.mimeType || "image/jpeg").toString();
  const audioBase64 = (body.audioBase64 || "").toString().replace(/^data:[^,]+,/, "");
  const audioMimeType = (body.audioMimeType || "audio/webm").toString();
  if (!message && !imageBase64 && !audioBase64) { res.status(400).json({ error: "Provide 'message', 'imageBase64', or 'audioBase64'." }); return; }
  if (imageBase64.length > 9_000_000) { res.status(413).json({ error: "Image too large (max ~6MB)." }); return; }
  if (audioBase64.length > 9_000_000) { res.status(413).json({ error: "Audio too large (max ~6MB / ~30s)." }); return; }
  if (message.length > 2000) { res.status(413).json({ error: "Message too long." }); return; }

  const productService = req.scope.resolve(Modules.PRODUCT);
  const graph = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const visitorId = (body.v || "anon").toString().slice(0, 64);

  // Region (once) for AED price resolution in hydrateProducts.
  let regionId: string | undefined;
  try {
    const { data } = await graph.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } });
    regionId = data[0]?.id;
  } catch {}

  // Cart context — titles for the prompt, handles to exclude from recommendations.
  const cart = Array.isArray(body.cart) ? body.cart.slice(0, 30) : [];
  const cartHandles = new Set(cart.map((c) => (c.handle || "").toString()).filter(Boolean));
  const cartContext = cart.map((c) => (c.title || "").toString().trim()).filter(Boolean).slice(0, 20).join(", ");

  // Every card any tool returns is registered here (handle -> full card). The final
  // suggestions[] and the add-to-cart variant_ids are built ONLY from this, so the agent
  // can never surface a fabricated product/price.
  const cardIndex = new Map<string, Card>();
  const register = (cards: Card[]): Card[] => { for (const c of cards) if (c?.handle && !cardIndex.has(c.handle)) cardIndex.set(c.handle, c); return cards; };
  // Trim a card to the fields the model needs (omit description/thumbnail to save tokens).
  const slim = (c: Card) => ({ handle: c.handle, title: c.title, category: c.category, brand: c.brand, price: c.price, in_stock: c.in_stock });

  // Medusa keyword fallback (only when Retail is unavailable) -> ranked handles.
  async function medusaSearchHandles(qstr: string): Promise<string[]> {
    const words = (qstr || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
    const terms = words.length ? words.slice(0, 4) : [(qstr || "").toLowerCase()];
    const score = new Map<string, { h: string; n: number }>();
    for (const t of terms) {
      try {
        const ps = await productService.listProducts({ q: t, status: "published" } as any, { take: 12 } as any);
        for (const p of ps) { const e = score.get(p.id) || { h: p.handle, n: 0 }; e.n++; score.set(p.id, e); }
      } catch {}
    }
    return [...score.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((e) => e.h);
  }

  // ---- Tools (all READ-ONLY; the agent never mutates the cart or places orders) ----
  async function searchProducts(qstr: string, maxPrice?: number, category?: string): Promise<Card[]> {
    const priceClause = maxPrice && maxPrice > 0 ? `price < ${Math.round(Number(maxPrice))}` : "";
    // Category is model-supplied -> sanitize before it reaches the Retail filter literal.
    const cat = category ? sanitizeFacet(category) : "";
    const catClause = cat ? `categories: ANY("${cat}")` : "";
    const filter = [priceClause, catClause].filter(Boolean).join(" AND ") || undefined;
    let r = await retailSearch(qstr, { visitorId, pageSize: 8, filter });
    // A mis-named category must never bury results: if scoping returned nothing, retry without it.
    if (catClause && r && r.ids.length === 0) {
      r = await retailSearch(qstr, { visitorId, pageSize: 8, filter: priceClause || undefined });
    }
    let handles: string[];
    if (r && r.ids.length) handles = r.ids.slice(0, 6);          // Retail = the agent's product brain
    else if (r === null) handles = await medusaSearchHandles(qstr); // Retail down -> Medusa fallback
    else handles = [];                                            // Retail responded with 0
    return register(await hydrateProducts(graph, handles, regionId));
  }
  async function getProductTool(handle: string) {
    const cards = register(await hydrateProducts(graph, [String(handle || "")], regionId));
    const c = cards[0];
    return c ? { ...slim(c), description: c.description } : { error: "not found" };
  }
  async function recommendComplementary(handle: string): Promise<Card[]> {
    try {
      const { data: prod } = await graph.graph({ entity: "product", fields: ["categories.handle"], filters: { handle: String(handle || "") } as any, pagination: { take: 1 } });
      const catHandles: string[] = (prod[0]?.categories || []).map((c: any) => c.handle).filter(Boolean);
      const related = [...new Set(catHandles.flatMap((ch) => COMPLEMENTARY[ch] || []))];
      if (!related.length) return [];
      // Retail filters by category NAME (proven in search/route.ts browse mode), so map the
      // related category handles -> names, then browse Retail for products in those categories.
      const { data: cats } = await graph.graph({ entity: "product_category", fields: ["name"], filters: { handle: related } as any, pagination: { take: related.length } });
      const names = (cats as any[]).map((c) => c.name).filter(Boolean).map(sanitizeFacet);
      if (!names.length) return [];
      const filter = `categories: ANY(${names.map((n) => `"${n}"`).join(",")})`;
      const r = await retailSearch("", { visitorId, pageSize: 10, filter });
      const handles = (r?.ids || []).filter((h) => h !== handle && !cartHandles.has(h) && !cardIndex.has(h)).slice(0, 3);
      return register(await hydrateProducts(graph, handles, regionId));
    } catch { return []; }
  }
  async function doVisualSearch(): Promise<Card[]> {
    if (!imageBase64) return [];
    try {
      const handles = await visualSearch(imageBase64); // Vision Product Search -> handles (often unindexed -> [])
      if (!handles.length) return [];
      return register(await hydrateProducts(graph, handles.slice(0, 6), regionId));
    } catch { return []; }
  }
  async function recommendForYou(): Promise<Card[]> {
    try {
      // Retail Recommendations (Predict) keyed to the shared visitor id. Returns null until
      // a rec model is provisioned -> the agent just gets [] and no-ops (no fabricated recs).
      const ids = await retailPredict({ visitorId, pageSize: 8 });
      if (!ids || !ids.length) return [];
      const handles = ids.filter((h) => !cartHandles.has(h)).slice(0, 6);
      return register(await hydrateProducts(graph, handles, regionId));
    } catch { return []; }
  }

  // Voice transcription. Browsers disagree on recording format: Chrome/Android emit WebM/Opus
  // (Google STT decodes it; Gemini rejects the webm container), Safari/iOS emit MP4/AAC (STT
  // CANNOT decode mp4/aac at all, but Gemini audio understanding can). The storefront now
  // transcodes to WAV before sending, but we stay robust to whatever arrives: WAV/WebM/Ogg ->
  // STT; mp4/aac/mp3 -> Gemini; each falls back to the other.
  async function sttTranscribe(b64: string, mime: string): Promise<string> {
    try {
      const token = await getAccessToken();
      const m = (mime || "").toLowerCase();
      const encoding = /ogg/.test(m) ? "OGG_OPUS" : /webm/.test(m) ? "WEBM_OPUS" : "LINEAR16";
      // Opus/WAV carry their sample rate in the header — let STT read it (avoids mismatch).
      const config: any = { encoding, languageCode: "en-US", alternativeLanguageCodes: ["en-GB", "ar-AE"], enableAutomaticPunctuation: true, model: "latest_short" };
      const r = await fetch("https://speech.googleapis.com/v1/speech:recognize", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT },
        body: JSON.stringify({ config, audio: { content: b64 } }),
      });
      const data: any = await r.json();
      if (!r.ok) { console.warn(`[voice] STT non-200 ${r.status}: ${String(data?.error?.message || "").slice(0, 160)}`); return ""; }
      return (data?.results || []).map((x: any) => x.alternatives?.[0]?.transcript || "").join(" ").trim();
    } catch (e) { console.warn(`[voice] STT error: ${(e as Error)?.message || e}`); return ""; }
  }
  async function geminiTranscribe(b64: string, mime: string): Promise<string> {
    try {
      const token = await getAccessToken();
      const m = (mime || "").toLowerCase();
      const gmime = /mp4|m4a|aac/.test(m) ? "audio/mp4" : /mpeg|mp3/.test(m) ? "audio/mpeg" : /ogg/.test(m) ? "audio/ogg" : /wav|x-wav|linear|pcm/.test(m) ? "audio/wav" : mime;
      const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: gmime, data: b64 } }, { text: "Transcribe the customer's spoken question (about pool/spa/pond/fountain equipment) to plain text. Reply with ONLY the words spoken — no preamble, no quotes." }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 120 },
        }),
      });
      const data: any = await r.json();
      if (!r.ok) { console.warn(`[voice] Gemini transcribe non-200 ${r.status}: ${String(data?.error?.message || "").slice(0, 160)}`); return ""; }
      return (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    } catch (e) { console.warn(`[voice] Gemini transcribe error: ${(e as Error)?.message || e}`); return ""; }
  }
  async function transcribeAudio(b64: string, mime: string): Promise<string> {
    const m = (mime || "").toLowerCase();
    if (/mp4|m4a|aac|mpeg|mp3/.test(m)) return (await geminiTranscribe(b64, m)) || (await sttTranscribe(b64, m));
    return (await sttTranscribe(b64, m)) || (await geminiTranscribe(b64, m));
  }

  // Retail user-event signal (Phase 2): the queries the agent actually searched this turn.
  // Fed back to Google Retail after the loop so assistant-driven discovery trains the model.
  const searchQueries: string[] = [];
  async function dispatch(name: string, args: any): Promise<any> {
    if (name === "search_products") {
      const q = sanitizeQuery(args?.query) || message;
      if (q) searchQueries.push(q);
      return (await searchProducts(q, Number(args?.max_price) || undefined, args?.category)).map(slim);
    }
    if (name === "get_product") return await getProductTool(args?.handle);
    if (name === "recommend_complementary") return (await recommendComplementary(args?.handle)).map(slim);
    if (name === "recommend_for_you") return (await recommendForYou()).map(slim);
    if (name === "visual_search") return (await doVisualSearch()).map(slim);
    if (name === "get_order_status") return await lookupOrderStatus(graph, { order: args?.order, email: args?.email });
    return { error: "unknown tool" };
  }
  // Queries are passed straight to Retail's `query` (not a filter literal), so only length-cap them.
  function sanitizeQuery(q: any): string { return String(q || "").slice(0, 120).trim(); }

  async function generateContent(token: string, payload: any): Promise<any> {
    const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
    const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data: any = await r.json();
    if (!r.ok) throw new Error(typeof data?.error?.message === "string" ? data.error.message : JSON.stringify(data).slice(0, 160));
    return data;
  }

  // Build the final suggestion cards: products the agent named in its reply first, then the
  // most recent tool results — all tool-grounded (never fabricated).
  // A price-null item (region price not resolved) is never offered as add-to-cart — drop its
  // variant_id so the widget renders "View" only, never a buyable card with no price.
  const toSuggestion = (c: Card) => ({ handle: c.handle, title: c.title, category: c.category, brand: c.brand, variant_id: c.price != null ? c.variant_id : null, price: c.price, currency: "AED", thumbnail: c.thumbnail, in_stock: c.in_stock });
  function buildSuggestions(reply: string) {
    const all = [...cardIndex.values()];
    const lc = (reply || "").toLowerCase();
    const named = all.filter((c) => c.title && lc.includes(c.title.toLowerCase().slice(0, 22)));
    const rest = all.filter((c) => !named.includes(c)).reverse();
    return [...named, ...rest].slice(0, 6).map(toSuggestion);
  }

  // ---- Resolve the effective text query (voice -> transcript) ----
  let effectiveMessage = message;
  if (!effectiveMessage && audioBase64) {
    effectiveMessage = await transcribeAudio(audioBase64, audioMimeType);
    if (!effectiveMessage) { res.json({ reply: "I didn't quite catch that — could you try again, or type your question?", suggestions: [], cta: null, ai: false, transcript: "" }); return; }
  }

  // ---- Agentic loop: Gemini function-calling grounded on the tools above ----
  const history = (Array.isArray(body.history) ? body.history : []).slice(-12);
  const firstParts: any[] = [];
  if (imageBase64) firstParts.push({ inlineData: { mimeType, data: imageBase64 } });
  let userText = effectiveMessage || (imageBase64 ? "Find products like the attached photo." : "");
  if (cartContext) userText += `\n\n[Customer's current cart: ${cartContext}]`;
  firstParts.push({ text: userText });
  const contents: any[] = [...history, { role: "user", parts: firstParts }];

  // Phase 3 (Conversational Insights): a structured per-conversation log → Cloud Logging,
  // queryable now (intents, tool usage, FAQ gaps, agent-assisted-conversion funnel) and
  // exportable to BigQuery / Google CCAI Insights later. No PII beyond the typed query.
  const toolsUsed: string[] = [];
  // Mask obvious PII (emails, long digit runs) before the query lands in Cloud Logging — the
  // support flow explicitly asks customers for their email/order number.
  const maskPII = (s: string) => (s || "").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]").replace(/\b\d{7,}\b/g, "[number]");
  const logSession = (extra: Record<string, any>) => {
    try {
      console.log(JSON.stringify({ type: "aqua_session", at: new Date().toISOString(), visitorId, hadImage: !!imageBase64, hadAudio: !!audioBase64, query: maskPII((effectiveMessage || "").slice(0, 200)), toolsUsed, ...extra }));
    } catch {}
  };

  // Phase 2: feed the assistant's OWN discovery back into Google Retail as user events, keyed by
  // the shared visitorId — so the recommendation model learns from AI-driven search/views, not
  // just storefront browsing. Fire-and-forget (never awaited; a Retail failure can't touch the
  // chat reply). PII is masked off the query; never emit add-to-cart/purchase-complete here —
  // those fire client-side on the real action to avoid double counting.
  const emitRetailUserEvents = (suggestionHandles: string[]) => {
    try {
      for (const q of [...new Set(searchQueries.map((s) => maskPII(s).slice(0, 256)).filter(Boolean))]) {
        void writeUserEvent("search", { visitorId, searchQuery: q });
      }
      const seen = new Set<string>();
      for (const h of suggestionHandles) {
        if (!h || seen.has(h)) continue;
        seen.add(h);
        void writeUserEvent("detail-page-view", { visitorId, productHandles: [h] });
      }
    } catch {}
  };

  try {
    const token = await getAccessToken(); // Rami-scoped token (drift-proof, not ADC)
    let reply = "";
    for (let step = 0; step < MAX_STEPS; step++) {
      const data = await generateContent(token, {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        tools: TOOLS,
        toolConfig: { functionCallingConfig: { mode: "AUTO" } },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      });
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const calls = parts.filter((p: any) => p.functionCall);
      if (!calls.length) { reply = parts.map((p: any) => p.text).filter(Boolean).join("").trim(); break; }
      contents.push({ role: "model", parts });
      const respParts: any[] = [];
      for (const c of calls) {
        toolsUsed.push(c.functionCall.name);
        const result = await dispatch(c.functionCall.name, c.functionCall.args || {});
        respParts.push({ functionResponse: { name: c.functionCall.name, response: { result } } });
      }
      contents.push({ role: "user", parts: respParts });
    }
    if (!reply) reply = cardIndex.size ? "Here are some options from our catalogue that should fit." : "I couldn't find a confident match — would you like a free consultation with our engineers?";
    const cta = wantsCheckout(effectiveMessage) ? { type: "go_to_checkout" } : null;
    const suggestions = buildSuggestions(reply);
    emitRetailUserEvents(suggestions.map((s) => s.handle));
    logSession({ ai: true, cta: cta?.type || null, nSuggestions: suggestions.length });
    res.json({ reply, suggestions, cta, ai: true, transcript: effectiveMessage });
  } catch (e: any) {
    logSession({ ai: false, error: String(e?.message || e).slice(0, 120) });
    res.json({
      reply: cardIndex.size ? "Here are some Aquora products that match. For a tailored specification, request a free consultation." : "Our advisor is briefly unavailable — please try again or request a free consultation.",
      suggestions: buildSuggestions(""), cta: null, ai: false, transcript: effectiveMessage, error: String(e?.message || e).slice(0, 120),
    });
  }
}
