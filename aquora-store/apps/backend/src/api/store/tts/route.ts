import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getAccessToken } from "../../../lib/gcp-token";

const PROJECT = process.env.GCP_PROJECT || "emerge-digital-web-7034";
// Clear, professional male UK voice (Google's newest, most natural Chirp3-HD line).
// Override with TTS_VOICE to swap (e.g. en-GB-Neural2-B, en-GB-Chirp3-HD-Iapetus).
const VOICE = process.env.TTS_VOICE || "en-GB-Chirp3-HD-Charon";
const LANG = process.env.TTS_LANG || "en-GB";

// Phase 1 polish: server-side Text-to-Speech for Ask Aqua's spoken replies. The browser's
// speechSynthesis is robotic + inconsistent across devices/OSes; Google Cloud TTS gives ONE
// natural, consistent professional male UK voice everywhere. Returns MP3 base64 to play.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const text = String((req.body as any)?.text || "").replace(/\s+/g, " ").trim().slice(0, 800);
  if (!text) {
    res.status(400).json({ error: "Provide 'text'." });
    return;
  }
  try {
    const token = await getAccessToken();
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "x-goog-user-project": PROJECT,
      },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: LANG, name: VOICE },
        // Chirp3-HD voices ignore pitch; speakingRate is honoured.
        audioConfig: { audioEncoding: "MP3", speakingRate: 1.0 },
      }),
    });
    const data: any = await r.json();
    if (!r.ok || !data.audioContent) {
      console.warn(`[tts] non-200 ${r.status}: ${String(data?.error?.message || "").slice(0, 160)}`);
      res.status(502).json({ error: "tts unavailable" });
      return;
    }
    res.json({ audioBase64: data.audioContent, mime: "audio/mpeg" });
  } catch (e: any) {
    res.status(502).json({ error: String(e?.message || e).slice(0, 120) });
  }
}
