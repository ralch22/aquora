"use client"

import { Transition } from "@headlessui/react"
import { Fragment, useEffect, useState } from "react"

type ToastKind = "success" | "error" | "info"
type ToastItem = { id: number; kind: ToastKind; title: string; description?: string }

// Module-level emitter so any component (including effects driven by server actions)
// can fire a toast without prop-drilling a context. Self-built (no @medusajs/ui).
let listeners: ((t: ToastItem) => void)[] = []
let counter = 0
function emit(kind: ToastKind, title: string, description?: string) {
  const item: ToastItem = { id: ++counter, kind, title, description }
  listeners.forEach((l) => l(item))
}
export const toast = {
  success: (title: string, description?: string) => emit("success", title, description),
  error: (title: string, description?: string) => emit("error", title, description),
  info: (title: string, description?: string) => emit("info", title, description),
}

const RAIL: Record<ToastKind, string> = {
  success: "bg-aquora-primary",
  error: "bg-rose-500",
  info: "bg-aquora-accent",
}

function Icon({ kind }: { kind: ToastKind }) {
  const cls = "h-4 w-4"
  if (kind === "error")
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M5 5l6 6M11 5l-6 6" />
      </svg>
    )
  if (kind === "info")
    return (
      <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M8 7.5v4M8 4.5h.01" />
      </svg>
    )
  return (
    <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8.5l3 3 7-7.5" />
    </svg>
  )
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    const l = (t: ToastItem) => {
      setItems((cur) => [...cur, t])
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 4200)
    }
    listeners.push(l)
    return () => {
      listeners = listeners.filter((x) => x !== l)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2.5"
    >
      {items.map((t) => (
        <Transition
          key={t.id}
          appear
          show
          as={Fragment}
          enter="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enterFrom="opacity-0 translate-y-3"
          enterTo="opacity-100 translate-y-0"
          leave="transition-all duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="pointer-events-auto flex items-start gap-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_22px_44px_-26px_rgba(11,31,36,0.28)]">
            <span aria-hidden className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${RAIL[t.kind]}`}>
              <Icon kind={t.kind} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-aquora-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs leading-relaxed text-aquora-muted">{t.description}</p>}
            </div>
          </div>
        </Transition>
      ))}
    </div>
  )
}
