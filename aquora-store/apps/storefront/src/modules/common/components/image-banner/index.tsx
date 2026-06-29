import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type BannerCta = { label: string; href: string }
export type ImageBannerProps = {
  image: string
  imageAlt: string
  eyebrow?: string
  headline: string
  text?: string
  cta?: BannerCta
  secondaryCta?: BannerCta
  /** hero = tall lead banner · strip = slim promo · category = medium page-top */
  variant?: "hero" | "strip" | "category"
  /** which side the image is emphasised / gradient falls away to */
  align?: "left" | "right"
  /** object-position focus for the photo */
  focus?: string
  priority?: boolean
}

// Image-led promotional banner composed from real photography. A full-bleed photo sits behind a
// directional brand gradient scrim (so text stays legible regardless of the image), with overlaid
// copy + CTA. Server component — no client JS. Reused for homepage, category, Pool Care and cart.
export default function ImageBanner({
  image,
  imageAlt,
  eyebrow,
  headline,
  text,
  cta,
  secondaryCta,
  variant = "hero",
  align = "left",
  focus = "center",
  priority = false,
}: ImageBannerProps) {
  const height =
    variant === "hero"
      ? "min-h-[440px] small:min-h-[520px]"
      : variant === "category"
      ? "min-h-[200px] small:min-h-[240px]"
      : "min-h-[150px] small:min-h-[170px]"

  // gradient scrim: opaque on the copy side, fading toward the photo side
  const scrim =
    align === "left"
      ? "bg-gradient-to-r from-aquora-secondary via-aquora-secondary/85 to-aquora-secondary/15"
      : "bg-gradient-to-l from-aquora-secondary via-aquora-secondary/85 to-aquora-secondary/15"

  const content = (
    <div
      className={`relative z-10 flex h-full flex-col justify-center ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      } ${variant === "strip" ? "gap-2 px-6 py-6 small:px-10" : "gap-3 px-6 py-10 small:px-12 small:py-12"}`}
    >
      <div className={`${variant === "hero" ? "max-w-xl" : "max-w-lg"} ${align === "right" ? "ml-auto" : ""}`}>
        {eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-aquora-accent backdrop-blur-sm small:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-aquora-accent" />
            {eyebrow}
          </span>
        )}
        <h2
          className={`font-heading font-extrabold tracking-tight text-white ${
            variant === "hero"
              ? "mt-4 text-3xl leading-[1.05] small:text-5xl lg:text-[3.4rem]"
              : variant === "category"
              ? "mt-3 text-2xl leading-tight small:text-[2rem]"
              : "text-xl leading-tight small:text-2xl"
          }`}
        >
          {headline}
        </h2>
        {text && variant !== "strip" && (
          <p className="mt-4 text-base leading-relaxed text-white/75 small:text-lg">{text}</p>
        )}
        {text && variant === "strip" && (
          <p className="mt-1 text-sm text-white/75">{text}</p>
        )}
        {(cta || secondaryCta) && (
          <div className={`mt-${variant === "strip" ? "3" : "7"} flex flex-wrap items-center gap-3 ${align === "right" ? "justify-end" : ""}`}>
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
    </div>
  )

  return (
    <div className={`relative w-full overflow-hidden rounded-[1.75rem] bg-aquora-secondary ${height}`}>
      {/* Photo */}
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="100vw"
        quality={70}
        className="object-cover"
        style={{ objectPosition: focus }}
      />
      {/* Brand scrim for legibility */}
      <div aria-hidden className={`absolute inset-0 ${scrim}`} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-aquora-secondary/50 via-transparent to-transparent" />
      {content}
    </div>
  )
}
