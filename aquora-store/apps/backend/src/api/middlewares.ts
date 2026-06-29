import { defineMiddlewares } from "@medusajs/framework/http";
import { rateLimit } from "../lib/rate-limit";

// Ask Aqua's voice + photo search POST base64 audio/image to /store/assistant. The route
// itself allows ~9MB payloads, but Medusa's default body-parser cap (~100KB) rejects them
// with HTTP 413 BEFORE the handler runs — so raise the limit for these multimodal routes.
//
// These routes are also public (publishable-key) and several are GCP-billed (Gemini / STT /
// TTS) or expose order data, so each carries a per-IP rate limit to cap cost/abuse and order
// enumeration. In-memory + per-instance (see lib/rate-limit) — a cheap cap, not a global one.
export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/assistant",
      method: ["POST"],
      bodyParser: { sizeLimit: "12mb" },
      middlewares: [rateLimit({ key: "assistant", windowMs: 60_000, max: 20 })],
    },
    {
      matcher: "/store/tts",
      method: ["POST"],
      bodyParser: { sizeLimit: "1mb" },
      middlewares: [rateLimit({ key: "tts", windowMs: 60_000, max: 40 })],
    },
    {
      matcher: "/store/order-status",
      method: ["GET"],
      middlewares: [rateLimit({ key: "order-status", windowMs: 60_000, max: 10 })],
    },
    {
      matcher: "/store/event",
      method: ["POST"],
      middlewares: [rateLimit({ key: "event", windowMs: 60_000, max: 120 })],
    },
    {
      matcher: "/store/cards",
      method: ["GET"],
      middlewares: [rateLimit({ key: "cards", windowMs: 60_000, max: 60 })],
    },
    {
      matcher: "/store/compare",
      method: ["GET"],
      middlewares: [rateLimit({ key: "compare", windowMs: 60_000, max: 60 })],
    },
    {
      matcher: "/store/reviews",
      method: ["GET"],
      middlewares: [rateLimit({ key: "reviews-get", windowMs: 60_000, max: 60 })],
    },
    {
      // Public review submission — tighter cap to deter spam (moderation-first holds the rest).
      matcher: "/store/reviews",
      method: ["POST"],
      bodyParser: { sizeLimit: "32kb" },
      middlewares: [rateLimit({ key: "reviews-post", windowMs: 60_000, max: 6 })],
    },
    {
      matcher: "/store/questions",
      method: ["GET"],
      middlewares: [rateLimit({ key: "questions-get", windowMs: 60_000, max: 60 })],
    },
    {
      matcher: "/store/questions",
      method: ["POST"],
      bodyParser: { sizeLimit: "16kb" },
      middlewares: [rateLimit({ key: "questions-post", windowMs: 60_000, max: 6 })],
    },
  ],
});
