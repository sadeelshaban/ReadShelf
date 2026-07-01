# Branding

## Logo assets

| File | Use |
|------|-----|
| `public/logo.png` | Header, landing, platform page, Open Graph |
| `public/favicon.png` | Browser tab, email templates |

Both files use the same ReadShelf mark: brown book with gold bookmark ribbon and pencil/star icon on cream background.

## Where the logo appears

| Location | Path |
|----------|------|
| Root layout metadata | `src/app/layout.tsx` |
| Landing page header | `src/app/page.tsx` |
| Platform page | `src/app/platform/page.tsx` |
| App header (shelf) | `src/components/layout/AppHeader.tsx` |
| Auth pages | `src/components/auth/AuthShell.tsx` |
| Email templates | `supabase/templates/*.html` |

Favicon ICO requests rewrite to PNG via `src/proxy.ts`.

## Color palette

Defined in `src/app/globals.css`:

| Token | Role |
|-------|------|
| `--color-primary` | Warm brown (#7B4B2A family) |
| `--color-accent` | Cream / parchment backgrounds |
| `--color-text` | Dark brown body text |
| Glass panels | Frosted cards on shelf and admin |

## Typography

| Font | Usage |
|------|-------|
| **Lora** (serif) | Headings, book titles |
| **Inter** (sans) | UI, body text |
| **Noto Sans Arabic** | PDF export embedded font |

## Background videos

| File | Page |
|------|------|
| `public/videos/empty-shelf-library-background.mp4` | Landing |
| `public/videos/auth-background.mp4` | Login, signup, forgot password |

## White-label customization

Buyer can rebrand by:

1. Replace `public/logo.png` and `public/favicon.png`
2. Update CSS variables in `globals.css`
3. Change `metadata` in `src/app/layout.tsx`
4. Replace background videos (optional)
5. Update email templates in `supabase/templates/`

No build-step required for asset swaps — redeploy after changes.

## Missing assets (buyer may add)

- SVG logo for crisp scaling
- `og-image.png` (1200×630) for social sharing
- App store icons if mobile wrapper added
- Brand guidelines PDF
