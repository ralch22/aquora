"use client"

import { motion, useMotionValue, useSpring } from "framer-motion"
import { ReactNode, useRef } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Premium CTA: a fully-rounded pill with a nested "button-in-button" trailing icon,
// magnetic pull toward the cursor (motion values, no re-renders), and a tactile press.
type Props = {
  href: string
  children: ReactNode
  variant?: "accent" | "ghost" | "ink"
  className?: string
}

const VARIANTS: Record<string, { pill: string; icon: string }> = {
  accent: { pill: "bg-aquora-accent text-aquora-ink", icon: "bg-aquora-ink/10" },
  ghost: { pill: "border border-white/40 text-white hover:bg-white/10", icon: "bg-white/15" },
  ink: { pill: "bg-aquora-ink text-white", icon: "bg-white/15" },
}

export default function MagneticCta({ href, children, variant = "accent", className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 160, damping: 14, mass: 0.1 })
  const y = useSpring(my, { stiffness: 160, damping: 14, mass: 0.1 })

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.28)
    my.set((e.clientY - (r.top + r.height / 2)) * 0.28)
  }
  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  const v = VARIANTS[variant] || VARIANTS.accent

  return (
    <motion.div ref={ref} style={{ x, y }} onMouseMove={onMove} onMouseLeave={reset} className={`inline-block ${className || ""}`}>
      <LocalizedClientLink
        href={href}
        className={`group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-semibold transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${v.pill}`}
      >
        <span>{children}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${v.icon}`}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4.5 11.5l7-7M6 4.5h5.5V10" />
          </svg>
        </span>
      </LocalizedClientLink>
    </motion.div>
  )
}
