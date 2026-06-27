// Auto-generated Aquora brand system
export const brand = {
  "name": "Aquora",
  "tagline": "Engineered for water that lasts.",
  "positioning": "Aquora is the Gulf's premium source for pool, spa, pond and fountain equipment — pairing genuinely engineered house product lines with the local expertise to specify, deliver and support them.",
  "voice": [
    "Confident",
    "Expert",
    "Clean",
    "Premium",
    "Practical",
    "Reassuring"
  ],
  "palette": {
    "primary": "#0E6E73",
    "secondary": "#0A3A42",
    "accent": "#E0A23B",
    "ink": "#0B1F24",
    "surface": "#F4F8F8",
    "muted": "#6E8C90"
  },
  "fonts": {
    "heading": "Sora",
    "body": "Inter"
  },
  "logo_concept": "A clean wordmark \"AQUORA\" set in a confident geometric sans, with the \"O\" reimagined as a precise ring whose lower arc thickens into a single curved water meniscus — reading at once as a droplet's surface, a pump impeller and a still pool seen edge-on. The mark works in deep aqua on light surfaces and reverses cleanly to white or warm-gold on the dark teal. The standalone \"O\" ring serves as a compact app icon and embossing motif, evoking precision engineering and calm water in one form.",
  "value_props": [
    {
      "title": "Genuine Engineering",
      "body": "Every Aquora house product line is specified to real hydraulic and durability standards — not badge-engineered imports — so pumps, filters and controls perform exactly as rated."
    },
    {
      "title": "Fast UAE-Wide Delivery",
      "body": "Stocked locally and dispatched across the Emirates and wider GCC, with priority fulfilment that keeps contractor schedules and pool seasons on track."
    },
    {
      "title": "Expert Design & Installation",
      "body": "Our technical team sizes, specifies and installs complete filtration, circulation and automation systems tailored to your pool, spa, pond or fountain."
    },
    {
      "title": "Dependable After-Sales Support",
      "body": "Genuine spares, clear warranties and responsive servicing mean your water systems stay running quietly and efficiently for years after purchase."
    }
  ]
} as const;

export const contact = {
  "email": "hello@aquora.ae",
  "phone": "+971 4 000 0000",
  "whatsapp": "+971 50 000 0000",
  "address": "Dubai Investment Park, Dubai, United Arab Emirates",
  "hours": "Sun-Thu, 8:00-18:00 GST"
} as const;

// A fake phone number is the worst trust-killer, so the all-zeros placeholders must NEVER
// render. Components gate on these flags and fall back to email + a Contact CTA. The moment a
// real number is set above (no run of 4+ zeros), phone/WhatsApp light up everywhere.
const _digits = (n: string) => n.replace(/\D/g, "")
export const hasRealPhone = !/0000/.test(_digits(contact.phone))
export const hasRealWhatsapp = !/0000/.test(_digits(contact.whatsapp))
