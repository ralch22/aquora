import { ReactNode } from "react"

// Premium double-bezel card used by checkout steps, the order summary, and account
// panels. Server-safe (no hooks).
export default function SectionShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-black/[0.06] bg-white p-6 shadow-[0_22px_44px_-26px_rgba(11,31,36,0.16)] small:p-8 ${className || ""}`}
    >
      {children}
    </div>
  )
}
