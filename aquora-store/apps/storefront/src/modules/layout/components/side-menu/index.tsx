"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"
import { categories } from "@lib/aquora/categories"


const SideMenuItems = {
  Home: "/",
  Services: "/services",
  About: "/about",
  Blog: "/blog",
  FAQ: "/faq",
  Account: "/account",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center font-medium text-aquora-ink/80 transition-colors ease-out duration-150 focus:outline-none hover:text-aquora-primary"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 text-sm text-white m-2">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-gradient-to-br from-aquora-secondary to-aquora-primary rounded-large justify-between p-6 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between" id="xmark">
                      <LocalizedClientLink
                        href="/"
                        onClick={close}
                        className="font-heading text-xl font-extrabold tracking-tight text-white leading-none"
                      >
                        AQU<span className="text-aquora-accent">O</span>RA
                      </LocalizedClientLink>
                      <button
                        aria-label="Close menu"
                        data-testid="close-menu-button"
                        onClick={close}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <XMark />
                      </button>
                    </div>
                    <LocalizedClientLink
                      href="/search"
                      onClick={close}
                      data-testid="mobile-search-link"
                      className="mt-5 flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.08] px-4 py-3 text-white/80 transition-colors hover:bg-white/[0.14] hover:text-white"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
                      <span className="text-sm">Search pumps, filters, heating…</span>
                    </LocalizedClientLink>
                    <ul className="flex flex-col gap-4 items-start justify-start mt-6">
                      {Object.entries(SideMenuItems).map(([name, href]) => {
                        if (name === "Account") {
                          return null
                        }
                        return (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="font-heading text-2xl leading-9 tracking-tight text-white hover:text-aquora-accent transition-colors duration-150"
                              onClick={close}
                              data-testid={`${name.toLowerCase()}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        )
                      })}

                      {/* Shop categories */}
                      <li className="w-full mt-2">
                        <p className="font-heading text-2xl leading-9 tracking-tight text-white">
                          Shop
                        </p>
                        <ul className="mt-3 flex flex-col gap-2 border-l border-white/15 pl-4">
                          {categories.map((cat) => (
                            <li key={cat.handle}>
                              <LocalizedClientLink
                                href={`/categories/${cat.handle}`}
                                className="block text-base text-white/80 hover:text-aquora-accent transition-colors duration-150"
                                onClick={close}
                              >
                                {cat.name}
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </li>

                      {/* Account last */}
                      <li className="mt-2">
                        <LocalizedClientLink
                          href="/account"
                          className="font-heading text-2xl leading-9 tracking-tight text-white hover:text-aquora-accent transition-colors duration-150"
                          onClick={close}
                          data-testid="account-link"
                        >
                          Account
                        </LocalizedClientLink>
                      </li>
                    </ul>
                    <div className="flex flex-col gap-y-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small text-white/70">
                        © {new Date().getFullYear()} Aquora. Engineered for
                        water that lasts.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
