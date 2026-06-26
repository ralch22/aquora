import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { categories } from "@lib/aquora/categories"

// Trim a category description down to a single, clean one-line blurb.
const blurb = (description: string) => {
  const firstSentence = description.split(/(?<=[.!?])\s/)[0].trim()
  if (firstSentence.length <= 90) return firstSentence
  return firstSentence.slice(0, 87).trimEnd() + "…"
}

const CategoryGrid = () => {
  return (
    <section className="bg-white">
      <div className="content-container py-16 small:py-24">
        <div className="mb-12 flex flex-col gap-4 small:flex-row small:items-end small:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-aquora-primary">
              The catalogue
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-aquora-ink small:text-4xl">
              Shop by category
            </h2>
            <p className="mt-4 text-base leading-relaxed text-aquora-muted">
              Twelve complete equipment lines for pools, spas, ponds and
              fountains — every part specified for Gulf water and climate.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-5 xsmall:grid-cols-2 small:grid-cols-3">
          {categories.map((category) => (
            <li key={category.handle}>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className="group flex h-full flex-col justify-between rounded-large border border-black/5 bg-aquora-surface p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-aquora-primary/20 hover:shadow-md"
              >
                <div>
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-aquora-ink">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-aquora-muted">
                    {blurb(category.description)}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-aquora-accentdark">
                  Explore range
                  <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default CategoryGrid
