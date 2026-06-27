import { Metadata } from "next"

import { contact } from "@lib/aquora/brand"
import PageHeader from "../blog/_lib/page-header"
import ContactForm from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Aquora — Pool, Spa & Fountain Equipment, Dubai",
  description:
    "Get in touch with Aquora's technical team for product advice, quotes, installation and after-sales support across the UAE and GCC.",
}

const wa = (contact.whatsapp || "").replace(/[^\d]/g, "")

function Row({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value: string
  href?: string
  icon: React.ReactNode
}) {
  const inner = (
    <div className="flex items-start gap-4">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aquora-primary/10 text-aquora-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-aquora-muted">{label}</p>
        <p className="mt-1 text-[15px] font-medium text-aquora-ink">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group block transition-opacity hover:opacity-80">
      {inner}
    </a>
  ) : (
    inner
  )
}

export default function ContactPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Contact"
        title="Talk to our team"
        subtitle="Product advice, project quotes, installation and after-sales support — we're here to help, anywhere in the UAE and GCC."
        variant="teal"
      />

      <section className="content-container py-16 small:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          {/* Details */}
          <div className="flex flex-col gap-8">
            <div className="rounded-[2rem] border border-black/5 bg-aquora-surface p-2">
              <div className="rounded-[calc(2rem-0.5rem)] bg-white p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                <div className="flex flex-col gap-7">
                  <Row
                    label="Email"
                    value={contact.email}
                    href={`mailto:${contact.email}`}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>}
                  />
                  <Row
                    label="Phone"
                    value={contact.phone}
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7A2 2 0 0 1 22 16.9Z" /></svg>}
                  />
                  {wa.length >= 8 && (
                    <Row
                      label="WhatsApp"
                      value={contact.whatsapp}
                      href={`https://wa.me/${wa}`}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1-1.4-1-2.6 0-1.3.6-1.9.9-2.1.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.6-.1 1.1Z" /></svg>}
                    />
                  )}
                  <Row
                    label="Visit / write to us"
                    value={contact.address}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>}
                  />
                  <Row
                    label="Hours"
                    value={contact.hours}
                    icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink">Send us a message</h2>
            <p className="mt-2 mb-7 text-aquora-muted">
              Tell us what you're working on and we'll get back to you with the right equipment and advice.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  )
}
