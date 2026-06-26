import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type ProductLite = {
  id: string;
  title: string;
  handle: string;
  subtitle?: string;
  description?: string;
  categories?: { name: string }[];
};

const SYSTEM_PROMPT = `You are "Aqua", the expert virtual advisor for Aquora — a premium Dubai/GCC supplier of pool, spa, pond and fountain equipment.
You help villa owners, contractors and facilities buyers specify the right equipment.
Be confident, expert, concise and practical. Use British-influenced UAE English and AED for prices.
Only recommend products from the provided catalogue context. If the catalogue lacks a good match, say so and suggest requesting a free consultation.
Keep answers under 130 words unless asked for detail. Never invent SKUs, prices or specifications that aren't in the context.`;

function keywordScore(p: ProductLite, terms: string[]): number {
  const hay = `${p.title} ${p.subtitle || ""} ${p.description || ""} ${(p.categories || [])
    .map((c) => c.name)
    .join(" ")}`.toLowerCase();
  let score = 0;
  for (const t of terms) if (t.length > 2 && hay.includes(t)) score += 1;
  return score;
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { message?: string };
  const message = (body.message || "").toString().trim();

  if (!message) {
    res.status(400).json({ error: "Missing 'message' in request body." });
    return;
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  // Pull a working set of published products to ground the answer.
  let products: ProductLite[] = [];
  try {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "subtitle", "description", "categories.name"],
      filters: { status: "published" },
      pagination: { take: 200 },
    });
    products = data as ProductLite[];
  } catch (e) {
    products = [];
  }

  const terms = message.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const ranked = products
    .map((p) => ({ p, s: keywordScore(p, terms) }))
    .sort((a, b) => b.s - a.s);
  const matched = ranked.filter((r) => r.s > 0).slice(0, 6).map((r) => r.p);
  const suggestions = (matched.length ? matched : ranked.slice(0, 4).map((r) => r.p)).map(
    (p) => ({
      title: p.title,
      handle: p.handle,
      subtitle: p.subtitle || null,
      category: p.categories?.[0]?.name || null,
    })
  );

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  // Graceful fallback when Gemini is not configured: keyword-matched suggestions + canned reply.
  if (!apiKey) {
    const reply = suggestions.length
      ? `Here are some Aquora products that match your enquiry. For a tailored specification, request a free consultation and our engineers will size the right system for you.`
      : `Thanks for your enquiry. Our engineers can help specify the right equipment — please request a free consultation and we'll get back to you.`;
    res.json({ reply, suggestions, ai: false });
    return;
  }

  const catalogueContext = suggestions
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}${s.category ? ` [${s.category}]` : ""}${
          s.subtitle ? ` — ${s.subtitle}` : ""
        } (/products/${s.handle})`
    )
    .join("\n");

  const userPrompt = `Customer question: ${message}\n\nRelevant Aquora catalogue items:\n${
    catalogueContext || "(no close matches found)"
  }\n\nAnswer the customer and, where relevant, point them to specific items above by name.`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
        }),
      }
    );
    if (!r.ok) {
      const txt = await r.text();
      res.json({
        reply:
          "Our advisor is briefly unavailable. Here are some relevant products, or request a free consultation.",
        suggestions,
        ai: false,
        error: `gemini_${r.status}`,
        detail: txt.slice(0, 300),
      });
      return;
    }
    const data = (await r.json()) as any;
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ||
      "I couldn't generate a response just now — please try again or request a consultation.";
    res.json({ reply, suggestions, ai: true });
  } catch (e: any) {
    res.json({
      reply:
        "Our advisor is briefly unavailable. Here are some relevant products, or request a free consultation.",
      suggestions,
      ai: false,
      error: "gemini_exception",
    });
  }
}
