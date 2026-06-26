"use client"

import { ReactNode, useEffect, useRef } from "react"

// Scroll-reveal via IntersectionObserver toggling the `.aq-in` class (styles in
// globals.css). Visible-safe: with no JS, content stays fully visible.
type Props = { children: ReactNode; delay?: number; className?: string }

export default function Reveal({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("aq-in")
          io.disconnect()
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`aq-srev ${className || ""}`} style={delay ? ({ "--aq-d": `${delay}ms` } as React.CSSProperties) : undefined}>
      {children}
    </div>
  )
}
