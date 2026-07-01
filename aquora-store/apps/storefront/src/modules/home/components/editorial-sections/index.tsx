import Image from "next/image"
import homepage from "@lib/aquora/content/homepage.json"

const IMAGES = [
  "/images/brand/editorial-equipment.webp",
  "/images/brand/editorial-install.webp",
  "/images/brand/editorial-delivery.webp",
  "/images/brand/editorial-support.webp",
]

const EditorialSections = () => {
  return (
    <section className="bg-white">
      <div className="content-container py-16 small:py-24">
        <div className="flex flex-col gap-16 small:gap-24">
          {homepage.sections.map((section, i) => {
            const reversed = i % 2 === 1
            return (
              <div
                key={section.heading}
                className="grid grid-cols-1 items-center gap-8 small:grid-cols-2 small:gap-16"
              >
                {/* Visual panel — real brand photography with a teal wash */}
                <div
                  className={`group relative aspect-[4/3] overflow-hidden rounded-large bg-aquora-secondary ${
                    reversed ? "small:order-2" : ""
                  }`}
                >
                  <Image
                    src={IMAGES[i % IMAGES.length]}
                    alt={section.heading}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-aquora-secondary/65 via-transparent to-transparent" />
                  <span className="absolute bottom-5 left-6 font-heading text-7xl font-extrabold text-white/25">
                    0{i + 1}
                  </span>
                </div>

                {/* Text */}
                <div className={reversed ? "small:order-1" : ""}>
                  <h3 className="font-heading text-2xl font-bold tracking-tight text-aquora-ink small:text-3xl">
                    {section.heading}
                  </h3>
                  <p className="mt-5 text-base leading-relaxed text-aquora-muted">
                    {section.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default EditorialSections
