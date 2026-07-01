# Branding

## Logo assets

| File | Use |
|------|-----|
| `public/logo.png` | Header, landing page, platform page, Open Graph |
| `public/favicon.png` | Browser tab, email templates |

Both files use the same ReadShelf mark: a brown book with a gold bookmark ribbon and a pencil/star icon on a cream background.

## Where the logo appears

| Location | Path |
|----------|------|
| Root layout metadata | `src/app/layout.tsx` |
| Landing page header | `src/app/page.tsx` |
| Platform page | `src/app/platform/page.tsx` |
| App header (shelf) | `src/components/layout/AppHeader.tsx` |
| Auth pages | `src/components/auth/AuthShell.tsx` |
| Email templates | `supabase/templates/*.html` |

Favicon `.ico` requests are rewritten to PNG via `src/proxy.ts`.

## Color palette

Defined in `src/app/globals.css`:

| Token | Role |
|-------|------|
| `--color-primary` | Warm brown (#7B4B2A family) |
| `--color-accent` | Cream / parchment backgrounds |
| `--color-text` | Dark brown body text |
| Glass panels | Frosted cards on the shelf and admin views |

## Typography

| Font | Usage |
|------|-------|
| **Lora** (serif) | Headings, book titles |
| **Inter** (sans) | UI, body text |
| **Noto Sans Arabic** | Embedded font for PDF export |

## Background videos

| File | Page |
|------|------|
| `public/videos/empty-shelf-library-background.mp4` | Landing |
| `public/videos/auth-background.mp4` | Login, signup, forgot password |

## White-label customization

A buyer can rebrand by:

1. Replacing `public/logo.png` and `public/favicon.png`
2. Updating the CSS variables in `globals.css`
3. Changing `metadata` in `src/app/layout.tsx`
4. Replacing the background videos (optional)
5. Updating the email templates in `supabase/templates/`

No build step is required for asset swaps — just redeploy after making changes.

## Missing assets (buyer may add)

- SVG logo for crisp scaling
- `og-image.png` (1200×630) for social sharing
- App store icons, if a mobile wrapper is added
- A brand guidelines PDF
