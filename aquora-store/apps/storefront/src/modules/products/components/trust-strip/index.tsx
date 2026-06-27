import { HttpTypes } from "@medusajs/types"
import { contact, hasRealWhatsapp } from "@lib/aquora/brand"

const ITEMS = [
  { title: "Genuine, engineered equipment", sub: "Specified to real performance standards" },
  { title: "Fast UAE-wide delivery", sub: "Dispatched across the Emirates & GCC" },
  { title: "Expert design & installation", sub: "Sizing and specification by our technical team" },
  { title: "Warranty & genuine spares", sub: "Responsive after-sales support" },
]

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-aquora-primary" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="7" className="opacity-20" />
      <path d="M5 8l2 2 4-4.5" />
    </svg>
  )
}

export default function TrustStrip({ product }: { product: HttpTypes.StoreProduct }) {
  const wa = (contact.whatsapp || "").replace(/[^0-9]/g, "")
  const msg = encodeURIComponent(`Hi Aquora, I'd like more information about: ${product.title}`)

  return (
    <div className="rounded-large border border-black/5 bg-aquora-surface p-5">
      <ul className="flex flex-col gap-3">
        {ITEMS.map((i) => (
          <li key={i.title} className="flex gap-2.5">
            <Check />
            <div>
              <p className="text-sm font-semibold text-aquora-ink leading-snug">{i.title}</p>
              <p className="text-xs text-aquora-muted">{i.sub}</p>
            </div>
          </li>
        ))}
      </ul>

      {hasRealWhatsapp && wa.length >= 8 && (
        <a
          href={`https://wa.me/${wa}?text=${msg}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 w-full rounded-full border border-aquora-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-aquora-primary hover:bg-aquora-primary/5 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1-1.4-1-2.6 0-1.3.6-1.9.9-2.1.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.6-.1 1.1Z" />
          </svg>
          Enquire on WhatsApp
        </a>
      )}
    </div>
  )
}
