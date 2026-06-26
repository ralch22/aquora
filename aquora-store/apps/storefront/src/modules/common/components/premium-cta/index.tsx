import { ReactNode } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Premium CTA: fully-rounded pill with a nested "button-in-button" trailing icon,
// hover physics and a tactile press. Pure CSS (works in Server Components).
type Variant = "accent" | "ghost" | "ink" | "primary"

const VARIANTS: Record<Variant, { pill: string; icon: string }> = {
  accent: { pill: "bg-aquora-accent text-aquora-ink hover:bg-aquora-accentdark", icon: "bg-aquora-ink/10" },
  ghost: { pill: "border border-white/40 text-white hover:bg-white/10", icon: "bg-white/15" },
  ink: { pill: "bg-aquora-ink text-white hover:bg-aquora-secondary", icon: "bg-white/15" },
  primary: { pill: "bg-aquora-primary text-white hover:bg-aquora-secondary", icon: "bg-white/15" },
}

export default function PremiumCta({
  href,
  children,
  variant = "accent",
  className,
}: {
  href: string
  children: ReactNode
  variant?: Variant
  className?: string
}) {
  const v = VARIANTS[variant]
  return (
    <LocalizedClientLink
      href={href}
      className={`group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-sm font-semibold transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-px active:translate-y-0 active:scale-[0.97] ${v.pill} ${className || ""}`}
    >
      <span>{children}</span>
      <span className={`grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${v.icon}`}>
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4.5 11.5l7-7M6 4.5h5.5V10" />
        </svg>
      </span>
    </LocalizedClientLink>
  )
}
