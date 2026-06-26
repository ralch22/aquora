Perfect! Now I have everything I need. Let me compile a comprehensive map of the Medusa v2 Next.js starter storefront structure with theming guidance.

## Medusa v2 Next.js Starter Storefront - Theming & Branding File Map

### Root & Layout Structure

**Root Layout (imports global CSS):**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/app/layout.tsx`
  - Imports: `styles/globals.css`
  - Sets up `<html>` and `<body>` wrapper with `data-mode="light"` for dark mode support

**Main Content Layout (includes Nav & Footer):**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/app/[countryCode]/(main)/layout.tsx`
  - Renders `<Nav />`, `<CartMismatchBanner />`, `<FreeShippingPriceNudge />`, `{children}`, `<Footer />`

**Homepage (Hero + Featured Products):**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/app/[countryCode]/(main)/page.tsx`
  - Renders `<Hero />` and `<FeaturedProducts />`

---

### Styling & Theme Files

**Global CSS (Tailwind directives + custom utilities):**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/styles/globals.css`
  - Imports Tailwind base, components, utilities
  - Defines custom Tailwind `@layer` utilities and components:
    - `.content-container` (max-width 1440px, px-6)
    - `.contrast-btn` (primary CTA button style)
    - Typography utilities: `.text-xsmall-regular`, `.text-small-semi`, `.text-base-regular`, `.text-xl-semi`, `.text-2xl-semi`, `.text-3xl-semi`, etc.
    - Form input focus states and webkit-autofill overrides

**Tailwind Config (with @medusajs/ui-preset):**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/tailwind.config.js`
  - **Presets:** `require("@medusajs/ui-preset")` — this is the Medusa design system preset
  - **Dark mode:** `darkMode: "class"` (controlled via `data-mode` on `<html>`)
  - **Custom colors (grey scale):** Extended with `theme.extend.colors.grey` (0–90 scale)
  - **Custom breakpoints:** `2xsmall` (320px), `xsmall` (512px), `small` (1024px), `medium` (1280px), `large` (1440px), `xlarge` (1680px), `2xlarge` (1920px)
  - **Font family:** `fontFamily.sans` defaults to `["Inter", "-apple-system", ...]`
  - **Animations & keyframes:** ring, fade-in-right/top, fade-out-top, accordion-slide-up/down, enter, leave, slide-in
  - **Plugins:** `tailwindcss-radix()` for Radix UI integration

**Next.js Config:**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/next.config.js`
  - Enables turbopack, image optimization for S3/AWS remotes
  - Runs `check-env-variables()` on startup

---

### Layout Components

**Navigation Header:**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/modules/layout/templates/nav/index.tsx`
  - Sticky top nav with 64px height (`h-16`)
  - Brand link: "Medusa Store" (centered, uppercase)
  - Left menu: `<SideMenu />` with regions & locales
  - Right section: Account link, Cart button with suspense fallback
  - Styling: `bg-white border-ui-border-base` (from @medusajs/ui-preset)

**Footer:**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/modules/layout/templates/footer/index.tsx`
  - Brand link: "Medusa Store" (left column)
  - Column layout: Categories, Collections, Medusa links
  - Dynamic categories fetched from backend via `listCategories()`
  - Copyright year dynamically set
  - Styling: `border-t border-ui-border-base` (preset colors)

---

### Homepage Components

**Hero Section:**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/modules/home/components/hero/index.tsx`
  - Full viewport height (`h-[75vh]`)
  - Centered flexbox with `<Heading>` (h1 & h2)
  - Title: "Ecommerce Starter Template" + "Powered by Medusa and Next.js"
  - CTA button linking to GitHub (secondary variant)
  - Styling: `bg-ui-bg-subtle border-b border-ui-border-base`

**Featured Products:**
- `/Users/admin/Documents/aquora/aquora-store/apps/storefront/src/modules/home/components/featured-products/index.tsx`
  - Maps collections to `<ProductRail>` components
  - Each rail displays 6 featured products per collection
- `src/modules/home/components/featured-products/product-rail/index.tsx`

---

### Supporting UI & Components

**Common Components (from @medusajs/ui):**
- `@modules/common/components/ui` exports:
  - `<Heading />` — semantic headings with className support
  - `<Button />` — variants: primary (default), secondary
  - `<Text />` — generic text wrapper with styling
  - `clx()` — utility for classname merging (like clsx)
- `@modules/common/components/localized-client-link` — i18n-aware link wrapper

**Icon Library:**
- `@medusajs/icons` (v2.17.0) — provides `<Github />`, other UI icons

---

### How to Change Primary Color

**Option 1: Override via Tailwind extend.colors**
In `tailwind.config.js`, add to `theme.extend.colors`:
```js
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        // ... etc
        900: '#0c2d6b',
      },
    },
  },
}
```

Then use `bg-primary-500`, `text-primary-600`, etc. in JSX.

**Option 2: Customize @medusajs/ui-preset tokens**
The preset uses CSS variables (e.g., `--colors-ui-fg-base`, `--colors-ui-bg-base`). To override, add CSS in `globals.css` at the `:root` level:
```css
:root {
  --colors-ui-fg-base: #1a202c;
  --colors-ui-bg-subtle: #f7fafc;
  /* ... other preset vars ... */
}
```

**Note on preset colors:** The starter uses `text-ui-fg-base`, `bg-ui-border-base`, `text-ui-fg-subtle`, `bg-ui-bg-subtle`, and `text-ui-fg-muted` (from `@medusajs/ui-preset`). These are mapped to CSS variables in the preset. To customize globally, override the preset's CSS variable definitions in `globals.css`.

---

### How to Add Custom Fonts

**Option 1: Local font files (recommended)**
1. Add `.ttf`, `.woff2` files to `public/fonts/`
2. In `globals.css`, add:
   ```css
   @font-face {
     font-family: 'YourFont';
     src: url('/fonts/yourfont.woff2') format('woff2');
     font-weight: normal;
   }
   ```
3. In `tailwind.config.js`, update `theme.extend.fontFamily.sans`:
   ```js
   fontFamily: {
     sans: ['YourFont', 'Inter', '-apple-system', ...],
   }
   ```

**Option 2: Google Fonts (via next/font)**
In `src/app/layout.tsx`, add:
```tsx
import { Inter, YourFont } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const yourFont = YourFont({ subsets: ['latin'] })

export default function RootLayout() {
  return (
    <html lang="en" className={yourFont.className}>
      ...
    </html>
  )
}
```

---

### Environment Variables

**In `.env.local`:**
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<from Medusa Admin>
NEXT_PUBLIC_STRIPE_KEY=<if using Stripe>
```

---

### Key Dependencies

```json
{
  "@medusajs/ui-preset": "2.17.0",
  "@medusajs/icons": "2.17.0",
  "@medusajs/js-sdk": "2.17.0",
  "next": "15.5.18",
  "react": "19.0.5",
  "tailwindcss": "^3.0.23",
  "tailwindcss-radix": "^2.8.0"
}
```

---

### Summary of Key Paths for Theming/Branding

| Element | Path |
|---------|------|
| Root layout | `src/app/layout.tsx` |
| Main layout (with nav/footer) | `src/app/[countryCode]/(main)/layout.tsx` |
| Global CSS | `src/styles/globals.css` |
| Tailwind config | `tailwind.config.js` |
| Nav header | `src/modules/layout/templates/nav/index.tsx` |
| Footer | `src/modules/layout/templates/footer/index.tsx` |
| Hero section | `src/modules/home/components/hero/index.tsx` |
| Featured products | `src/modules/home/components/featured-products/index.tsx` |
| Fonts | `public/fonts/` + `globals.css` + `tailwind.config.js` |
| Brand text | Search for "Medusa Store" in nav/footer TSX files |

---

### Recent Changes (Medusa v2.17.0)

- Uses **Next.js 15.5.18** with turbopack (`next dev --turbopack`)
- **React 19.0.5** with async component support in routes
- **@medusajs/ui-preset** v2.17.0 provides design tokens via CSS variables (not hard-coded Tailwind colors)
- **Radix UI** integration via `tailwindcss-radix` plugin for unstyled primitives
- Dark mode via CSS class strategy (`data-mode="light"` on `<html>`)

Sources:
- [Next.js Starter Storefront - Medusa Documentation](https://docs.medusajs.com/resources/nextjs-starter)
- [GitHub - medusajs/nextjs-starter-medusa](https://github.com/medusajs/nextjs-starter-medusa)
- [Medusa UI Documentation](https://docs.medusajs.com/ui)