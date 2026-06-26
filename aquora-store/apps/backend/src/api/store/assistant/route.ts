import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { visualSearch } from "../../../lib/vision-search";
import { getAccessToken } from "../../../lib/gcp-token";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
const LOCATION = process.env.GCP_LOCATION || "global";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM = `You are "Aqua", the expert multimodal shopping advisor for Aquora — a premium UAE/GCC supplier of pool, spa, pond and fountain equipment.
Help customers find the right equipment. Be confident, expert, concise and practical; UAE English; prices in AED.
ALWAYS call search_products (with the key product nouns, e.g. "robotic cleaner", "LED light", "sand filter") BEFORE telling a customer something isn't available — the catalogue has ~6,000 items. When the user attaches a photo, call visual_search. Use get_product for details.
Only recommend products returned by the tools — never invent SKUs or prices. If the tools genuinely return nothing, suggest a free consultation. Keep replies under ~140 words.`;

const TOOLS = [{
  functionDeclarations: [
    {
      name: "search_products",
      description: "Full-text search the Aquora catalogue for products matching a query (e.g. 'variable speed pump', 'sand filter 20ft pool').",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
    {
      name: "visual_search",
      description: "Find products visually similar to the photo the customer attached. Call this (no arguments) when an image is provided.",
      parameters: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_product",
      description: "Get details for one product by its handle.",
      parameters: { type: "object", properties: { handle: { type: "string" } }, required: ["handle"] },
    },
  ],
}];

type Sugg = { title: string; handle: string; category: string | null };

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { message?: string; imageBase64?: string; history?: any[] };
  const message = (body.message || "").toString().trim();
  const imageBase64 = (body.imageBase64 || "").toString().replace(/^data:[^,]+,/, "");
  if (!message && !imageBase64) { res.status(400).json({ error: "Provide 'message' and/or 'imageBase64'." }); return; }
  if (imageBase64.length > 9_000_000) { res.status(413).json({ error: "Image too large (max ~6MB)." }); return; }
  if (message.length > 2000) { res.status(413).json({ error: "Message too long." }); return; }

  const productService = req.scope.resolve(Modules.PRODUCT);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const suggestions: Sugg[] = [];
  const pushSugg = (arr: any[]) => { for (const p of arr) if (p?.handle && !suggestions.find((s) => s.handle === p.handle)) suggestions.push({ title: p.title, handle: p.handle, category: p.categories?.[0]?.name || null }); };

  const STOP = new Set(["pool","spa","the","for","with","you","have","need","want","best","good","show","find","please","some","this","that","your","our","and","any","what","which","looking","like","would"]);
  async function searchProducts(qstr: string) {
    const words = (qstr || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w));
    const terms = words.length ? words.slice(0, 4) : [(qstr || "").toLowerCase()];
    const score = new Map<string, { p: any; n: number }>();
    for (const t of terms) {
      try {
        const products = await productService.listProducts({ q: t, status: "published" } as any, { take: 12 } as any);
        for (const p of products) { const e = score.get(p.id) || { p, n: 0 }; e.n++; score.set(p.id, e); }
      } catch {}
    }
    const ranked = [...score.values()].sort((a, b) => b.n - a.n).slice(0, 6).map((e) => e.p);
    pushSugg(ranked);
    return ranked.map((p: any) => ({ title: p.title, handle: p.handle, category: p.categories?.[0]?.name || null }));
  }
  async function getProduct(handle: string) {
    try {
      const { data } = await query.graph({ entity: "product", fields: ["title", "handle", "description", "categories.name"], filters: { handle, status: "published" } as any, pagination: { take: 1 } });
      const p = data[0]; if (!p) return { error: "not found" };
      pushSugg([p]);
      return { title: p.title, handle: p.handle, description: p.description, category: p.categories?.[0]?.name || null };
    } catch { return { error: "lookup failed" }; }
  }
  async function doVisualSearch() {
    if (!imageBase64) return [];
    try {
      const handles = await visualSearch(imageBase64); // Vision Product Search -> product handles
      if (!handles.length) return [];
      const { data } = await query.graph({ entity: "product", fields: ["title", "handle", "categories.name"], filters: { handle: handles, status: "published" } as any, pagination: { take: 6 } });
      pushSugg(data);
      return data.map((p: any) => ({ title: p.title, handle: p.handle, category: p.categories?.[0]?.name || null }));
    } catch { return []; }
  }
  // Multimodal photo-search: Gemini identifies the equipment in the photo -> search keywords.
  async function identifyFromImage(b64: string): Promise<string> {
    try {
      const token = await getAccessToken();
      const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
      const r = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/jpeg", data: b64 } }, { text: "This is a photo of pool, spa, pond or fountain equipment. Reply with ONLY 2-4 short product-search keywords (e.g. \"sand filter\", \"robotic cleaner\", \"heat pump\", \"LED light\"), comma-separated. No other text." }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 40 },
        }),
      });
      const data: any = await r.json();
      if (!r.ok) return "";
      return (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text).filter(Boolean).join(" ").replace(/\n/g, " ").trim();
    } catch { return ""; }
  }
  async function dispatch(name: string, args: any) {
    if (name === "search_products") return await searchProducts(args?.query || message);
    if (name === "visual_search") return await doVisualSearch();
    if (name === "get_product") return await getProduct(args?.handle);
    return { error: "unknown tool" };
  }

  // ---- Retrieve first (reliable RAG), then let Gemini compose a grounded reply ----
  let imgKeywords = "";
  if (imageBase64) {
    imgKeywords = await identifyFromImage(imageBase64); // Gemini vision -> keywords
    if (imgKeywords) await searchProducts(imgKeywords);
    if (!suggestions.length) await doVisualSearch(); // Vision Product Search fallback (if ever indexed)
  }
  if (message) await searchProducts(message);
  void dispatch; void getProduct; void TOOLS; // (tool defs retained for future agentic mode)

  try {
    const token = await getAccessToken(); // Rami-scoped token (drift-proof, not ADC)
    const ctx = suggestions.slice(0, 8).map((s, i) => `${i + 1}. ${s.title}${s.category ? ` [${s.category}]` : ""} (/products/${s.handle})`).join("\n");
    const userParts: any[] = [];
    if (imageBase64) userParts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });
    userParts.push({ text: `Customer: ${message || "Find products like the attached photo."}\n\nRelevant Aquora catalogue items:\n${ctx || "(no close matches found)"}\n\nRecommend the most suitable items by name and explain briefly why they fit. If nothing fits, suggest a free consultation. Be concise.` });
    const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [...(Array.isArray(body.history) ? body.history : []), { role: "user", parts: userParts }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
      }),
    });
    const data: any = await r.json();
    if (!r.ok) throw new Error(typeof data?.error?.message === "string" ? data.error.message : JSON.stringify(data).slice(0, 160));
    const reply = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text).filter(Boolean).join("").trim()
      || (suggestions.length ? "Here are some options from our catalogue that should fit." : "I couldn't find a confident match — would you like a free consultation with our engineers?");
    res.json({ reply, suggestions: suggestions.slice(0, 6), ai: true });
  } catch (e: any) {
    res.json({
      reply: suggestions.length ? "Here are some Aquora products that match. For a tailored specification, request a free consultation." : "Our advisor is briefly unavailable — please try again or request a free consultation.",
      suggestions: suggestions.slice(0, 6), ai: false, error: String(e?.message || e).slice(0, 120),
    });
  }
}
