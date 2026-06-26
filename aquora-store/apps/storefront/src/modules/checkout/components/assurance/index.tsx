import { contact } from "@lib/aquora/brand"

const POINTS = [
  {
    title: "Secure checkout",
    sub: "Your details are encrypted in transit",
    icon: (
      <path d="M5 7V5a3 3 0 0 1 6 0v2M4 7h8v6H4V7Z" />
    ),
  },
  {
    title: "Genuine equipment & warranty",
    sub: "Authentic products with after-sales support",
    icon: <path d="M8 1.5 3 3.5v4c0 3 2.2 5.2 5 6.5 2.8-1.3 5-3.5 5-6.5v-4L8 1.5Z" />,
  },
  {
    title: "Fast UAE-wide delivery",
    sub: "Dispatched across the Emirates & GCC",
    icon: <path d="M1 4h8v6H1V4Zm8 2h3l2 2v2H9V6ZM4 12.5a1 1 0 1 0 0-.001M11.5 12.5a1 1 0 1 0 0-.001" />,
  },
]

export default function CheckoutAssurance() {
  return (
    <div className="rounded-large border border-black/5 bg-aquora-surface p-5">
      <ul className="flex flex-col gap-3">
        {POINTS.map((p) => (
          <li key={p.title} className="flex gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-aquora-primary">
              {p.icon}
            </svg>
            <div>
              <p className="text-sm font-semibold text-aquora-ink leading-snug">{p.title}</p>
              <p className="text-xs text-aquora-muted">{p.sub}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-black/5 text-xs text-aquora-muted">
        Need help with your order?{" "}
        <a href={`mailto:${contact.email}`} className="text-aquora-primary hover:underline">
          {contact.email}
        </a>{" "}
        · {contact.phone}
      </div>
    </div>
  )
}
