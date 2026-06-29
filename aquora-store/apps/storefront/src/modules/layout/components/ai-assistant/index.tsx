"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import { trackAddToCart } from "@lib/analytics"
import { trackRetailEvent } from "@lib/aquora/retail-track"
import { toast } from "@modules/common/components/toast"

type Suggestion = {
  title: string
  handle: string
  subtitle?: string
  category?: string
  brand?: string
  variant_id?: string | null
  price?: number | null
  currency?: string
  thumbnail?: string | null
  in_stock?: boolean
}

type CartItem = { title?: string; variant_id?: string; handle?: string }

type Message = {
  role: "user" | "assistant"
  text: string
  suggestions?: Suggestion[]
  image?: string
  pending?: boolean
  checkout?: boolean
}

type AssistantResponse = {
  reply?: string
  suggestions?: Suggestion[]
  cta?: { type?: string } | null
  ai?: boolean
  transcript?: string
}

const GREETING: Message = {
  role: "assistant",
  text: "Hi, I'm Aqua — Aquora's equipment advisor. Tell me about your pool, spa, pond or fountain and I'll find the right pumps, filters, heating or automation — and add them straight to your cart. How can I help?",
}

const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const CameraIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const MicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
  </svg>
)

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const SpeakerOnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
  </svg>
)

const SpeakerOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </svg>
)

// Read a Blob as base64 (no data: prefix).
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]+,/, ""))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Bound a fetch so a hung/cold-start backend can't leave the chat stuck "thinking…" forever.
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ac.signal })
  } finally {
    clearTimeout(t)
  }
}

// Keep the rendered transcript bounded — each message can carry a base64 image data URL, so
// an unbounded list leaks memory over a long session.
const MAX_MESSAGES = 40

// Encode an AudioBuffer to a 16 kHz mono 16-bit PCM WAV. Google STT decodes WAV reliably,
// while browser recording formats differ (Chrome → WebM/Opus, Safari/iOS → MP4/AAC, which
// STT can't decode). Transcoding to WAV client-side makes voice work the same everywhere.
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const targetRate = 16000
  const src = buffer.getChannelData(0)
  const ratio = buffer.sampleRate / targetRate
  const len = Math.max(1, Math.floor(src.length / ratio))
  const dataSize = len * 2
  const ab = new ArrayBuffer(44 + dataSize)
  const dv = new DataView(ab)
  const ws = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i))
  }
  ws(0, "RIFF"); dv.setUint32(4, 36 + dataSize, true); ws(8, "WAVE")
  ws(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true)
  dv.setUint32(24, targetRate, true); dv.setUint32(28, targetRate * 2, true)
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true)
  ws(36, "data"); dv.setUint32(40, dataSize, true)
  let off = 44
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, src[Math.floor(i * ratio)] || 0))
    dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    off += 2
  }
  return new Blob([ab], { type: "audio/wav" })
}

// Transcode a recorded audio blob to WAV base64; returns null if the browser can't decode it.
async function toWavBase64(blob: Blob): Promise<string | null> {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return null
    const ac = new Ctx()
    try {
      const audio = await ac.decodeAudioData(await blob.arrayBuffer())
      return await blobToBase64(audioBufferToWav(audio))
    } finally {
      try {
        ac.close()
      } catch {}
    }
  } catch {
    return null
  }
}

// Render Aqua's reply with light markdown — **bold**, numbered/bulleted lists, paragraphs —
// so structured answers read cleanly instead of showing raw "**" and run-together list items.
function renderInline(text: string, kp: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? (
      <strong key={`${kp}-${i}`} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={`${kp}-${i}`}>{p}</span>
    )
  )
}

function RichText({ text }: { text: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const blocks: { type: "p" | "ol" | "ul"; items: string[] }[] = []
  for (const line of lines) {
    const ol = /^\d+[.)]\s+(.*)/.exec(line)
    const ul = /^[-*•]\s+(.*)/.exec(line)
    const last = blocks[blocks.length - 1]
    if (ol) {
      if (last?.type === "ol") last.items.push(ol[1])
      else blocks.push({ type: "ol", items: [ol[1]] })
    } else if (ul) {
      if (last?.type === "ul") last.items.push(ul[1])
      else blocks.push({ type: "ul", items: [ul[1]] })
    } else {
      blocks.push({ type: "p", items: [line] })
    }
  }
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i} className={i ? "mt-2" : ""}>
            {renderInline(b.items[0], `p${i}`)}
          </p>
        ) : b.type === "ol" ? (
          <ol key={i} className="mt-1.5 list-decimal space-y-1 pl-4">
            {b.items.map((it, j) => (
              <li key={j}>{renderInline(it, `o${i}${j}`)}</li>
            ))}
          </ol>
        ) : (
          <ul key={i} className="mt-1.5 list-disc space-y-1 pl-4">
            {b.items.map((it, j) => (
              <li key={j}>{renderInline(it, `u${i}${j}`)}</li>
            ))}
          </ul>
        )
      )}
    </>
  )
}

// Plain text for the spoken reply — strip markdown so the voice never reads "asterisk".
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const AiAssistant = ({ cartItems = [] }: { cartItems?: CartItem[] }) => {
  const params = useParams()
  const router = useRouter()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : "us"

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<{ dataUrl: string; mime: string } | null>(null)
  const [recording, setRecording] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(false)
  const [addingHandle, setAddingHandle] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Multi-turn memory (Gemini Content[], text-only) + a stable visitor id for Retail.
  const historyRef = useRef<{ role: "user" | "model"; parts: { text: string }[] }[]>([])
  const vidRef = useRef<string>("")
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speakGenRef = useRef(0)

  useEffect(() => {
    try {
      let v = localStorage.getItem("aq_vid")
      if (!v) {
        v = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem("aq_vid", v)
      }
      vidRef.current = v
    } catch {}
  }, [])

  const recordTurn = (userText: string, replyText: string) => {
    historyRef.current = [
      ...historyRef.current,
      { role: "user" as const, parts: [{ text: userText || "(no text)" }] },
      { role: "model" as const, parts: [{ text: replyText || "" }] },
    ].slice(-12)
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.size > 6 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setImage({ dataUrl: String(reader.result), mime: file.type || "image/jpeg" })
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, open])

  // Bound the transcript: keep the greeting + the last MAX_MESSAGES so a long session can't
  // grow state/DOM unbounded (each message may hold a base64 image data URL). Trims with a
  // hysteresis gap so it can't loop.
  useEffect(() => {
    if (messages.length > MAX_MESSAGES + 6) {
      setMessages((prev) => [prev[0], ...prev.slice(-MAX_MESSAGES)])
    }
  }, [messages.length])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const stopSpeaking = () => {
    speakGenRef.current++ // invalidate any in-flight speakReply so stale audio can't play
    try {
      audioRef.current?.pause()
      audioRef.current = null
    } catch {}
    try {
      window.speechSynthesis?.cancel()
    } catch {}
  }

  // Browser TTS fallback (only if the natural Google voice can't be fetched/played).
  const browserSpeak = (text: string) => {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = "en-GB"
      u.rate = 1.02
      window.speechSynthesis?.speak(u)
    } catch {}
  }

  // Speak a reply in one consistent, natural professional male UK voice (Google Cloud TTS),
  // instead of the robotic, device-dependent browser speechSynthesis.
  const speakReply = async (text: string) => {
    if (!speakReplies || typeof window === "undefined" || !text) return
    const clean = stripMarkdown(text)
    if (!clean) return
    stopSpeaking()
    const gen = speakGenRef.current // captured after stopSpeaking; bail if a newer reply/cancel changes it
    const stale = () => gen !== speakGenRef.current || !speakReplies
    try {
      const res = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/tts`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({ text: clean }),
        },
        12000
      )
      if (stale()) return
      if (res.ok) {
        const d = (await res.json()) as { audioBase64?: string; mime?: string }
        if (stale()) return
        if (d.audioBase64) {
          const audio = new Audio(`data:${d.mime || "audio/mpeg"};base64,${d.audioBase64}`)
          audio.onended = () => {
            if (audioRef.current === audio) audioRef.current = null
          }
          audioRef.current = audio
          audio.play().catch(() => {
            if (!stale()) browserSpeak(clean)
          })
          return
        }
      }
    } catch {}
    if (!stale()) browserSpeak(clean)
  }

  const postToAssistant = async (reqBody: Record<string, unknown>): Promise<AssistantResponse> => {
    const full = {
      ...reqBody,
      history: historyRef.current.slice(-12),
      cart: cartItems || [],
      ...(vidRef.current ? { v: vidRef.current } : {}),
    }
    const res = await fetchWithTimeout(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/assistant`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        body: JSON.stringify(full),
      },
      25000
    )
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return (await res.json()) as AssistantResponse
  }

  const appendAssistant = (data: AssistantResponse) => {
    const text = data.reply || "I'm here to help with Aquora equipment — could you rephrase that?"
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text,
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : undefined,
        checkout: data.cta?.type === "go_to_checkout",
      },
    ])
    speakReply(text)
  }

  const appendError = () => {
    setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't reach our advisor just now. Please try again in a moment, or contact our team directly." }])
  }

  const addCard = async (s: Suggestion) => {
    if (!s.variant_id || addingHandle) return
    setAddingHandle(s.handle)
    try {
      await addToCart({ variantId: s.variant_id, quantity: 1, countryCode })
      trackAddToCart({ id: s.variant_id, name: s.title, price: s.price ?? undefined, quantity: 1, category: s.category })
      trackRetailEvent("add-to-cart", { productHandles: [s.handle] })
      router.refresh() // re-render the server cart badge / dropdown
      toast.success("Added to cart", s.title)
    } catch {
      toast.error("Couldn't add to cart", "Please try again, or open the product page.")
    } finally {
      setAddingHandle(null)
    }
  }

  const sendMessage = async () => {
    const message = input.trim()
    if ((!message && !image) || loading || recording) return

    const sentImage = image
    const userText = message || (sentImage ? "Sent a photo" : "")
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message || (sentImage ? "What is this? Do you have it?" : ""), image: sentImage?.dataUrl },
    ])
    setInput("")
    setImage(null)
    setLoading(true)
    try {
      const reqBody: Record<string, unknown> = {}
      if (message) reqBody.message = message
      if (sentImage) {
        reqBody.imageBase64 = sentImage.dataUrl.replace(/^data:[^,]+,/, "")
        reqBody.mimeType = sentImage.mime
      }
      const data = await postToAssistant(reqBody)
      appendAssistant(data)
      recordTurn(userText, data.reply || "")
    } catch {
      appendError()
    } finally {
      setLoading(false)
    }
  }

  // ---- Voice input (MediaRecorder -> WebM/Opus -> backend Speech-to-Text) ----
  const stopRecording = () => {
    if (recTimerRef.current) {
      clearTimeout(recTimerRef.current)
      recTimerRef.current = null
    }
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop()
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setRecording(false)
  }

  const sendAudio = async (blob: Blob) => {
    if (!blob.size) return
    setLoading(true)
    setMessages((prev) => [...prev, { role: "user", text: "🎤 …", pending: true }])
    try {
      // Transcode to WAV (works for Chrome WebM/Opus + Safari MP4/AAC); fall back to the raw
      // recording if the browser can't decode it (the backend stays format-tolerant too).
      const wavB64 = await toWavBase64(blob)
      const audioBase64 = wavB64 ?? (await blobToBase64(blob))
      const audioMimeType = wavB64 ? "audio/wav" : blob.type || "audio/webm"
      const data = await postToAssistant({ audioBase64, audioMimeType })
      const transcript = data.transcript || "🎤 (voice message)"
      setMessages((prev) => {
        const next = [...prev]
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].pending) {
            next[i] = { role: "user", text: transcript }
            break
          }
        }
        return next
      })
      appendAssistant(data)
      recordTurn(data.transcript || "(voice message)", data.reply || "")
    } catch {
      setMessages((prev) => prev.filter((m) => !m.pending))
      appendError()
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    if (recording || loading) return
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessages((prev) => [...prev, { role: "assistant", text: "Voice input isn't supported in this browser — you can type your question instead." }])
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : ""
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data)
      }
      mr.onstop = () => sendAudio(new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" }))
      recorderRef.current = mr
      mr.start()
      setRecording(true)
      recTimerRef.current = setTimeout(() => stopRecording(), 30000)
    } catch {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setMessages((prev) => [...prev, { role: "assistant", text: "I need microphone access to listen. Please allow it, or type your question instead." }])
    }
  }

  useEffect(() => {
    if (!open) {
      stopRecording()
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  useEffect(() => {
    return () => {
      stopSpeaking()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 small:bottom-6 small:right-6">
      {open && (
        <div
          role="dialog"
          aria-label="Aqua — Aquora advisor"
          className="flex w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-large border border-black/5 bg-white shadow-xl"
          style={{ height: "min(580px, calc(100vh - 7rem))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-aquora-secondary to-aquora-primary px-4 py-3 text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ChatIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-semibold tracking-tight">Aqua</span>
                <span className="rounded-full bg-aquora-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aquora-ink">AI</span>
              </div>
              <p className="truncate text-xs text-white/75">Shopping agent</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSpeakReplies((v) => {
                  if (v) stopSpeaking()
                  return !v
                })
              }}
              aria-label="Read replies aloud"
              aria-pressed={speakReplies}
              title={speakReplies ? "Voice replies on" : "Voice replies off"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {speakReplies ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Message list */}
          <div ref={scrollRef} aria-live="polite" aria-atomic="false" className="flex-1 space-y-3 overflow-y-auto bg-aquora-surface px-3 py-4">
            {messages.map((msg, i) => (
              <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[85%] rounded-large rounded-br-sm bg-aquora-primary px-3.5 py-2 text-sm leading-relaxed text-white shadow-sm"
                      : "max-w-[90%] rounded-large rounded-bl-sm border border-black/5 bg-white px-3.5 py-2 text-sm leading-relaxed text-aquora-ink shadow-sm"
                  }
                >
                  {msg.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={msg.image} alt="Attached" className="mb-1.5 max-h-32 w-auto rounded-lg object-cover" />
                  )}
                  {msg.role === "assistant" ? <RichText text={msg.text} /> : msg.text}
                </div>

                {/* Rich product cards */}
                {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex w-full max-w-full flex-col gap-2">
                    {msg.suggestions.map((s, j) => (
                      <div
                        key={`${s.handle}-${j}`}
                        className="flex gap-2.5 rounded-large border border-aquora-muted/30 bg-white p-2 shadow-sm"
                      >
                        {s.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.thumbnail} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-aquora-surface object-contain p-1" />
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-lg bg-aquora-surface" />
                        )}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <a
                            href={`/${countryCode}/products/${s.handle}`}
                            className="line-clamp-2 text-xs font-semibold leading-snug text-aquora-ink transition hover:text-aquora-primary"
                          >
                            {s.title}
                          </a>
                          <div className="mt-0.5 flex items-center gap-2">
                            {s.price != null && (
                              <span className="text-xs font-bold text-aquora-ink">
                                AED {Number(s.price).toLocaleString("en-AE")}
                              </span>
                            )}
                            <span className={`text-[10px] font-medium ${s.in_stock ? "text-aquora-primary" : "text-aquora-muted"}`}>
                              {s.in_stock ? "Available" : "Made to order"}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => addCard(s)}
                              disabled={!s.variant_id || addingHandle === s.handle}
                              className="rounded-full bg-aquora-primary px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-aquora-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {addingHandle === s.handle ? "Adding…" : "Add to cart"}
                            </button>
                            <a
                              href={`/${countryCode}/products/${s.handle}`}
                              className="rounded-full border border-aquora-muted/40 px-3 py-1 text-[11px] font-semibold text-aquora-ink transition hover:border-aquora-primary hover:text-aquora-primary"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Checkout hand-off */}
                {msg.role === "assistant" && msg.checkout && (
                  <button
                    type="button"
                    onClick={() => router.push(`/${countryCode}/checkout?step=address`)}
                    className="btn-primary !rounded-full px-4 py-1.5 text-xs font-semibold"
                  >
                    Proceed to checkout →
                  </button>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start">
                <div className="flex items-center gap-1 rounded-large rounded-bl-sm border border-black/5 bg-white px-3.5 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-aquora-muted [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-aquora-muted [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-aquora-muted" />
                </div>
              </div>
            )}
          </div>

          {/* Footer / input */}
          <div className="border-t border-black/5 bg-white px-3 py-3">
            {image && (
              <div className="mb-2 flex items-center gap-2 rounded-large border border-black/5 bg-aquora-surface p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.dataUrl} alt="To send" className="h-10 w-10 rounded-lg object-cover" />
                <span className="flex-1 text-xs text-aquora-muted">Photo attached — send to identify it.</span>
                <button type="button" onClick={() => setImage(null)} aria-label="Remove photo" className="flex h-6 w-6 items-center justify-center rounded-full text-aquora-muted transition hover:bg-black/5">
                  <CloseIcon />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onPickFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={loading || recording}
                aria-label="Attach a photo to search"
                title="Search by photo"
                className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-large border border-aquora-muted/30 text-aquora-muted transition hover:border-aquora-primary hover:text-aquora-primary disabled:opacity-50"
              >
                <CameraIcon />
              </button>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={loading}
                aria-label={recording ? "Stop recording" : "Ask by voice"}
                aria-pressed={recording}
                title={recording ? "Stop recording" : "Speak your question"}
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-large border transition disabled:opacity-50 ${
                  recording
                    ? "animate-pulse border-red-500 bg-red-500 text-white motion-reduce:animate-none"
                    : "border-aquora-muted/30 text-aquora-muted hover:border-aquora-primary hover:text-aquora-primary"
                }`}
              >
                {recording ? <StopIcon /> : <MicIcon />}
              </button>
              {recording ? (
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-large border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600" aria-live="polite">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 motion-reduce:animate-none" aria-hidden="true" />
                  Listening… tap to stop
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask, speak, or attach a photo…"
                  aria-label="Message Aqua"
                  disabled={loading}
                  className="min-w-0 flex-1 rounded-large border border-aquora-muted/30 bg-aquora-surface px-3 py-2 text-sm text-aquora-ink outline-none transition placeholder:text-aquora-muted focus:border-aquora-primary disabled:opacity-60"
                />
              )}
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || recording || (!input.trim() && !image)}
                aria-label="Send message"
                className="btn-primary flex h-[38px] w-[38px] shrink-0 items-center justify-center !rounded-large !p-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SendIcon />
              </button>
            </div>
            <p className="mt-2 px-1 text-center text-[10px] text-aquora-muted">
              Aqua can make mistakes — confirm specs with our team.
            </p>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Ask Aqua" : "Ask Aqua"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-aquora-primary text-white shadow-lg shadow-aquora-secondary/30 ring-1 ring-white/10 transition hover:bg-aquora-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-aquora-accent active:scale-95"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  )
}

export default AiAssistant
