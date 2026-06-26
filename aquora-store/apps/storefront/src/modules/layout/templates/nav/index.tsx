import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { categories } from "@lib/aquora/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
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

      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-black/5">
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

                {/* Dropdown panel */}
                <div className="invisible opacity-0 translate-y-1 group-hover/shop:visible group-hover/shop:opacity-100 group-hover/shop:translate-y-0 transition-all duration-200 absolute top-full left-0 z-50 pt-3">
                  <div className="w-[640px] max-w-[90vw] rounded-large border border-black/5 bg-white shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-br from-aquora-secondary to-aquora-primary px-6 py-4">
                      <p className="font-heading text-base font-bold tracking-tight text-white">
                        Shop by category
                      </p>
                      <p className="mt-0.5 text-xs text-white/70">
                        Engineered equipment for pools, spas, ponds &amp;
                        fountains.
                      </p>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-6 gap-y-1 p-4">
                      {categories.map((cat) => (
                        <li key={cat.handle}>
                          <LocalizedClientLink
                            href={`/categories/${cat.handle}`}
                            className="group/cat flex items-center gap-x-2 rounded-rounded px-3 py-2 text-sm text-aquora-ink/80 hover:bg-aquora-surface hover:text-aquora-primary transition-colors duration-150"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-aquora-muted/40 group-hover/cat:bg-aquora-accent transition-colors duration-150" />
                            {cat.name}
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
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
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-aquora-ink/80 hover:text-aquora-primary transition-colors duration-150 flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
