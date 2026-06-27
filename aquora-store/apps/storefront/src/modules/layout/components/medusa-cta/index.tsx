import { Text } from "@modules/common/components/ui"

// Minimal Aquora checkout-footer line (replaces the default "Powered by Medusa & Next.js"
// branding so the storefront reads as a pure Aquora store).
const MedusaCTA = () => {
  return (
    <Text className="flex items-center gap-x-1.5 text-xs text-aquora-muted">
      <svg className="h-3.5 w-3.5 text-aquora-primary" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M8 1.5l5 2v3.5c0 3.2-2.1 5.3-5 6.5-2.9-1.2-5-3.3-5-6.5V3.5l5-2Z" strokeLinejoin="round" />
        <path d="M6 8l1.5 1.5L10.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Secure SSL checkout · © {new Date().getFullYear()} Aquora
    </Text>
  )
}

export default MedusaCTA
