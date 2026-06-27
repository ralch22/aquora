"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

type Suggestion = {
  title: string
  handle: string
  subtitle?: string
  category?: string
}

type Message = {
  role: "user" | "assistant"
  text: string
  suggestions?: Suggestion[]
  image?: string
  pending?: boolean
}

const GREETING: Message = {
  role: "assistant",
  text: "Hi, I'm Aqua — Aquora's equipment advisor. Tell me about your pool, spa, pond or fountain and I'll point you to the right pumps, filters, heating or automation. How can I help?",
}

const ChatIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SendIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
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

const AiAssistant = () => {
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : "us"

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<{ dataUrl: string; mime: string } | null>(null)
  const [recording, setRecording] = useState(false)
  const [speakReplies, setSpeakReplies] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const recTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.size > 6 * 1024 * 1024) return
    const reader = new FileReader()
    reader.onload = () => setImage({ dataUrl: String(reader.result), mime: file.type || "image/jpeg" })
    reader.readAsDataURL(file)
  }

  // Auto-scroll to the latest message
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, open])

  // Focus the input when the panel opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const speakReply = (text: string) => {
    if (!speakReplies || typeof window === "undefined" || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = "en-GB"
      u.rate = 1.02
      window.speechSynthesis.speak(u)
    } catch {}
  }

  const postToAssistant = async (reqBody: Record<string, unknown>) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/assistant`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      body: JSON.stringify(reqBody),
    })
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return (await res.json()) as { reply?: string; suggestions?: Suggestion[]; ai?: boolean; transcript?: string }
  }

  const appendAssistant = (data: { reply?: string; suggestions?: Suggestion[] }) => {
    const text = data.reply || "I'm here to help with Aquora equipment — could you rephrase that?"
    setMessages((prev) => [...prev, { role: "assistant", text, suggestions: Array.isArray(data.suggestions) ? data.suggestions : undefined }])
    speakReply(text)
  }

  const appendError = () => {
    setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't reach our advisor just now. Please try again in a moment, or contact our team directly." }])
  }

  const sendMessage = async () => {
    const message = input.trim()
    if ((!message && !image) || loading || recording) return

    const sentImage = image
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
      appendAssistant(await postToAssistant(reqBody))
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
    setMessages((prev) => [...prev, { role: "user", text: "🎤 …", pending: true }]) // optimistic
    try {
      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]+,/, ""))
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      const data = await postToAssistant({ audioBase64, audioMimeType: blob.type || "audio/webm" })
      setMessages((prev) => {
        const next = [...prev]
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].pending) {
            next[i] = { role: "user", text: data.transcript || "🎤 (voice message)" }
            break
          }
        }
        return next
      })
      appendAssistant(data)
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
      recTimerRef.current = setTimeout(() => stopRecording(), 30000) // 30s safety cap
    } catch {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setMessages((prev) => [...prev, { role: "assistant", text: "I need microphone access to listen. Please allow it, or type your question instead." }])
    }
  }

  // Cleanup audio + speech on close/unmount
  useEffect(() => {
    if (!open) {
      stopRecording()
      try {
        window.speechSynthesis?.cancel()
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel()
      } catch {}
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
      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Aqua — Aquora advisor"
          className="flex w-[calc(100vw-2.5rem)] max-w-[360px] flex-col overflow-hidden rounded-large border border-black/5 bg-white shadow-xl"
          style={{ height: "min(560px, calc(100vh - 7rem))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-aquora-secondary to-aquora-primary px-4 py-3 text-white">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <ChatIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-semibold tracking-tight">
                  Aqua
                </span>
                <span className="rounded-full bg-aquora-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-aquora-ink">
                  AI
                </span>
              </div>
              <p className="truncate text-xs text-white/75">Aquora advisor</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSpeakReplies((v) => {
                  if (v) {
                    try {
                      window.speechSynthesis?.cancel()
                    } catch {}
                  }
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
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-aquora-surface px-3 py-4"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.role === "user"
                    ? "flex justify-end"
                    : "flex flex-col items-start gap-2"
                }
              >
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[85%] rounded-large rounded-br-sm bg-aquora-primary px-3.5 py-2 text-sm leading-relaxed text-white shadow-sm"
                      : "max-w-[88%] rounded-large rounded-bl-sm border border-black/5 bg-white px-3.5 py-2 text-sm leading-relaxed text-aquora-ink shadow-sm"
                  }
                >
                  {msg.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.image}
                      alt="Attached"
                      className="mb-1.5 max-h-32 w-auto rounded-lg object-cover"
                    />
                  )}
                  {msg.text}
                </div>

                {msg.role === "assistant" &&
                  msg.suggestions &&
                  msg.suggestions.length > 0 && (
                    <div className="flex max-w-full flex-wrap gap-2">
                      {msg.suggestions.map((s, j) => (
                        <a
                          key={`${s.handle}-${j}`}
                          href={`/${countryCode}/products/${s.handle}`}
                          className="group flex max-w-full flex-col rounded-large border border-aquora-muted/30 bg-white px-3 py-1.5 text-left shadow-sm transition hover:border-aquora-primary hover:shadow"
                        >
                          <span className="truncate text-xs font-semibold text-aquora-ink group-hover:text-aquora-primary">
                            {s.title}
                          </span>
                          {(s.subtitle || s.category) && (
                            <span className="truncate text-[11px] text-aquora-muted">
                              {s.subtitle || s.category}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {/* Typing indicator */}
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
