"use server"

import { sdk } from "@lib/config"

// Forwards the contact form to the backend /store/contact route (which emails the team via
// Resend). The Medusa SDK attaches the publishable key automatically.
export async function submitContact(data: {
  name: string
  email: string
  phone?: string
  message: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await sdk.client.fetch("/store/contact", { method: "POST", body: data })
    return { ok: true }
  } catch (e: any) {
    return {
      ok: false,
      error:
        e?.message ||
        "Sorry — we couldn't send your message. Please email hello@aquora.ae directly.",
    }
  }
}
