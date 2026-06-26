import homepage from "@lib/aquora/content/homepage.json"

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
                {/* Visual panel — CSS-only teal motif */}
                <div
                  className={`relative aspect-[4/3] overflow-hidden rounded-large bg-gradient-to-br from-aquora-secondary to-aquora-primary ${
                    reversed ? "small:order-2" : ""
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full text-white/10"
                    viewBox="0 0 400 300"
                    fill="none"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <path
                      d="M0 200 C 80 170, 140 230, 220 200 S 360 170, 400 200"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path
                      d="M0 230 C 80 200, 140 260, 220 230 S 360 200, 400 230"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute right-8 top-8 h-28 w-28 rounded-full border border-aquora-accent/30">
                    <div className="absolute inset-4 rounded-full border border-white/15" />
                  </div>
                  <span className="absolute bottom-6 left-7 font-heading text-7xl font-extrabold text-white/10">
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
