# Legal pages

Public legal documents for ReadShelf users and buyers.

| Page | URL | File |
|------|-----|------|
| Terms of Service | `/terms` | `src/app/terms/page.tsx` |
| Privacy Policy | `/privacy` | `src/app/privacy/page.tsx` |
| Copyright Notice | `/copyright` | `src/app/copyright/page.tsx` |

## Implementation

- **Footer:** `src/components/layout/SiteFooter.tsx` — copyright + links on landing, app, admin, platform
- **First-visit gate:** `src/components/legal/LegalAcceptanceGate.tsx` — stored in `localStorage` (`readshelf-legal-accepted-v1`)
- **Signup:** checkbox required on `/signup` before account creation
- **Constants:** `src/lib/legal/constants.ts` — `© 2026 ReadShelf. All rights reserved.`

## Updating copy

Edit the page files above and bump the "Last updated" date. For acquisition handover, buyers may replace contact email and entity name in constants and legal pages.
