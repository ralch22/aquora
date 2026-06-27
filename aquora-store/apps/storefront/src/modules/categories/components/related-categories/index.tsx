import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { COMPLEMENTARY } from "@lib/aquora/complementary"
import { categories } from "@lib/aquora/categories"

// Cross-category discovery at the bottom of a category page — uses the honest complementary
// map so shoppers can jump to the equipment that pairs with what they're viewing.
export default function RelatedCategories({ handle }: { handle: string }) {
  const related = (COMPLEMENTARY[handle] || [])
    .map((h) => categories.find((c) => c.handle === h))
    .filter((c): c is (typeof categories)[number] => Boolean(c))

  if (!related.length) return null

  return (
    <div className="mt-16 border-t border-black/[0.06] pt-10">
      <h2 className="font-heading text-xl font-bold tracking-tight text-aquora-ink small:text-2xl">
        Complete your setup
      </h2>
      <p className="mt-1 text-sm text-aquora-muted">
        Equipment that pairs with this category.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 small:grid-cols-2 lg:grid-cols-3">
        {related.map((c) => (
          <LocalizedClientLink
            key={c.handle}
            href={`/categories/${c.handle}`}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-aquora-primary/25 hover:shadow-[0_18px_36px_-22px_rgba(14,110,115,0.3)]"
          >
            <span className="font-heading font-semibold text-aquora-ink transition-colors group-hover:text-aquora-primary">
              {c.name}
            </span>
            <svg className="h-5 w-5 shrink-0 text-aquora-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-aquora-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}
