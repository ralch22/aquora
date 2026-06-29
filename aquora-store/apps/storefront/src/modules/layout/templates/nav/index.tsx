import Image from "next/image"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { categories } from "@lib/aquora/categories"
import { categoryImage } from "@lib/aquora/category-images"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import WishlistNav from "@modules/layout/components/wishlist-nav"
import SideMenu from "@modules/layout/components/side-menu"
import SearchBox from "@modules/layout/components/search-box"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      {/* Announcement bar */}
      <div className="bg-aquora-secondary text-white">
        <p className="content-container flex items-center justify-center gap-x-2 py-2 text-center text-xs leading-tight tracking-wide">
          <span>Free delivery across the UAE on orders over AED 500</span>
          <span className="text-aquora-accent" aria-hidden="true">
            ·
          </span>
          <span className="hidden small:inline">
            Expert design, installation &amp; after-sales support
          </span>
        </p>
      </div>

      <header className="relative mx-auto h-16 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
        <nav className="content-container text-aquora-ink/80 flex items-center justify-between w-full h-full text-small-regular">
          {/* Left: mobile menu + desktop shop/links */}
          <div className="flex-1 basis-0 h-full flex items-center gap-x-6">
            <div className="h-full small:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>

            <div className="hidden small:flex items-center gap-x-7 h-full">
              {/* Shop mega-menu */}
              <div className="relative h-full flex items-center group/shop">
                <button
                  type="button"
                  className="h-full flex items-center gap-x-1 font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
                  aria-haspopup="true"
                >
                  Shop
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    className="transition-transform duration-200 group-hover/shop:rotate-180"
                    aria-hidden="true"
                  >
                    <path
                      d="M1.5 3.5L5 7L8.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Mega-menu */}
                <div className="invisible absolute left-0 top-full z-50 translate-y-2 pt-3 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/shop:visible group-hover/shop:translate-y-0 group-hover/shop:opacity-100">
                  <div className="flex w-[760px] max-w-[92vw] overflow-hidden rounded-[1.5rem] border border-black/[0.06] bg-white shadow-[0_30px_70px_-28px_rgba(11,31,36,0.32)]">
                    <div className="flex-1 p-5">
                      <p className="mb-3 px-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-aquora-muted">
                        Shop by category
                      </p>
                      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {categories.map((cat) => {
                          const img = categoryImage(cat.handle)
                          return (
                            <li key={cat.handle}>
                              <LocalizedClientLink
                                href={`/categories/${cat.handle}`}
                                className="group/cat flex items-center gap-x-2.5 rounded-xl px-2 py-1.5 text-sm text-aquora-ink/80 transition-colors duration-150 hover:bg-aquora-surface hover:text-aquora-primary"
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-black/[0.05] bg-gradient-to-b from-white to-aquora-surface">
                                  {img ? (
                                    <Image src={img} alt="" width={36} height={36} quality={45} className="h-full w-full object-contain p-1" />
                                  ) : (
                                    <span className="h-1.5 w-1.5 rounded-full bg-aquora-muted/40" />
                                  )}
                                </span>
                                <span className="leading-tight">{cat.name}</span>
                              </LocalizedClientLink>
                            </li>
                          )
                        })}
                      </ul>
                      <LocalizedClientLink href="/store" className="mt-3 inline-flex items-center gap-1.5 px-2.5 text-sm font-semibold text-aquora-primary transition-colors hover:text-aquora-secondary">
                        View all products
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                        </svg>
                      </LocalizedClientLink>
                    </div>
                    <LocalizedClientLink href="/store" className="group/feat relative hidden w-60 shrink-0 overflow-hidden bg-gradient-to-br from-aquora-secondary to-aquora-primary p-6 text-white small:block">
                      <svg aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 text-white/[0.07]" viewBox="0 0 240 120" fill="none">
                        <path d="M0 80 Q 60 50 120 80 T 240 80" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M0 100 Q 60 70 120 100 T 240 100" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <p className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-aquora-accent">Not sure what you need?</p>
                      <p className="relative mt-2 font-heading text-lg font-bold leading-snug">Ask Aqua — our AI advisor</p>
                      <p className="relative mt-2 text-xs leading-relaxed text-white/70">Describe, photograph or speak what you need and get the right kit in seconds.</p>
                      <span className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-aquora-accent px-4 py-2 text-xs font-semibold text-aquora-ink transition-transform duration-300 group-hover/feat:-translate-y-0.5">
                        Browse the catalogue
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M4.5 11.5l7-7M6 4.5h5.5V10" />
                        </svg>
                      </span>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>

              <LocalizedClientLink
                href="/brands"
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
              >
                Brands
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/services"
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
              >
                Services
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/pool-care"
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
              >
                Pool Care
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/about"
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
              >
                About
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/blog"
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
              >
                Blog
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/faq"
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
              >
                FAQ
              </LocalizedClientLink>
            </div>
          </div>

          {/* Center: wordmark */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="font-heading text-2xl font-extrabold tracking-tight text-aquora-ink leading-none"
              data-testid="nav-store-link"
            >
              AQU<span className="text-aquora-primary">O</span>RA
            </LocalizedClientLink>
          </div>

          {/* Right: account + cart */}
          <div className="flex items-center gap-x-5 h-full flex-1 basis-0 justify-end">
            <SearchBox className="hidden small:block" />
            <div className="hidden small:flex items-center gap-x-5 h-full">
              <LocalizedClientLink
                className="font-medium text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <WishlistNav />
            {/* Inline, not a streamed <Suspense> — deferred Suspense boundaries never flush
                React's `$RC` in this deployment, which would leave the cart stuck on a
                non-interactive "Cart (0)" fallback (wrong count, dead hover dropdown). The (main)
                layout already reads the cart cookie, so inline CartButton adds no new dynamic
                constraint and resolves before the shell flush, so it paints AND hydrates. */}
            <CartButton />
          </div>
        </nav>
      </header>
    </div>
  )
}
