import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { BannerCta } from "@modules/common/components/image-banner"

export type ProductBannerProps = {
  /** a real product photo (typically a white-background object-contain shot) */
  image: string
  imageAlt: string
  eyebrow?: string
  headline: string
  text?: string
  cta?: BannerCta
  secondaryCta?: BannerCta
  /** which side the product photo sits on */
  imageSide?: "left" | "right"
  price?: string
}

// Split promotional banner: a brand-gradient copy panel beside a real PRODUCT photo on a light
// panel (so white-background product shots present cleanly). Server component — no client JS.
export default function ProductBanner({
  image,
  imageAlt,
  eyebrow,
  headline,
  text,
  cta,
  secondaryCta,
  imageSide = "right",
  price,
}: ProductBannerProps) {
  const copy = (
    <div className="relative z-10 flex flex-col justify-center bg-gradient-to-br from-aquora-secondary to-aquora-primary px-7 py-10 text-white small:px-10 small:py-12">
      {eyebrow && (
        <span className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-aquora-accent backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 font-heading text-3xl font-extrabold leading-[1.06] tracking-tight small:text-[2.5rem]">
        {headline}
      </h2>
      {text && <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">{text}</p>}
      {price && <p className="mt-5 font-heading text-xl font-bold text-white">{price}</p>}
      {(cta || secondaryCta) && (
        <div className="mt-7 flex flex-wrap items-center gap-3">
          {cta && (
            <LocalizedClientLink
              href={cta.href}
              className="group inline-flex items-center gap-2 rounded-full bg-aquora-accent py-3 pl-6 pr-3 text-sm font-semibold text-aquora-ink shadow-sm transition active:scale-[0.98]"
            >
              {cta.label}
              <span className="grid h-7 w-7 place-items-center rounded-full bg-black/10 transition-transform duration-300 group-hover:translate-x-0.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                </svg>
              </span>
            </LocalizedClientLink>
          )}
          {secondaryCta && (
            <LocalizedClientLink
              href={secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {secondaryCta.label}
            </LocalizedClientLink>
          )}
        </div>
      )}
    </div>
  )

  const photo = (
    <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-b from-white to-aquora-surface small:min-h-0">
      <Image
        src={image}
        alt={imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        quality={75}
        className="object-contain p-8 small:p-10"
      />
    </div>
  )

  return (
    <div className="grid overflow-hidden rounded-[1.75rem] border border-black/[0.06] shadow-[0_28px_60px_-34px_rgba(11,31,36,0.4)] small:grid-cols-2 small:items-stretch">
      {imageSide === "left" ? (
        <>
          <div className="order-2 small:order-1">{photo}</div>
          <div className="order-1 small:order-2">{copy}</div>
        </>
      ) : (
        <>
          {copy}
          {photo}
        </>
      )}
    </div>
  )
}
