import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http";

// Lightweight per-IP fixed-window rate limiter for the public, GCP-billed / data routes
// (/store/assistant, /store/tts, /store/order-status, /store/event). In-memory + per-Cloud-Run-
// instance — a cheap abuse/cost cap, not a global guarantee (a global limit would need Redis).
// It stops a single client from spamming the Gemini/STT/TTS endpoints or enumerating orders.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function clientIp(req: MedusaRequest): string {
  // Behind Cloudflare, x-forwarded-for[0] is a *CF edge* IP that rotates per request — so it
  // can't key a per-client limit. cf-connecting-ip is the real client IP; prefer it.
  const cf = (req.headers["cf-connecting-ip"] || "").toString();
  if (cf) return cf.trim();
  const xff = (req.headers["x-forwarded-for"] || "").toString();
  if (xff) return xff.split(",")[0].trim();
  const real = (req.headers["x-real-ip"] || "").toString();
  if (real) return real.trim();
  return (req.socket as any)?.remoteAddress || "unknown";
}

export function rateLimit(opts: { key: string; windowMs: number; max: number }) {
  const { key, windowMs, max } = opts;
  return (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction): void => {
    const now = Date.now();
    const k = `${key}:${clientIp(req)}`;

    // Opportunistic cleanup of expired buckets (bounds memory under abuse).
    if (now - lastSweep > 60_000 || buckets.size > 10_000) {
      lastSweep = now;
      for (const [bk, b] of buckets) if (b.resetAt <= now) buckets.delete(bk);
    }

    let b = buckets.get(k);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(k, b);
    }
    b.count++;

    if (b.count > max) {
      const retry = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retry));
      res.status(429).json({ error: "Too many requests — please slow down and try again shortly." });
      return;
    }
    next();
  };
}
