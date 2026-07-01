# Legal Pages

Public legal documents for ReadShelf users and buyers.

| Page | URL | File |
|------|-----|------|
| Terms of Service | `/terms` | `src/app/terms/page.tsx` |
| Privacy Policy | `/privacy` | `src/app/privacy/page.tsx` |
| Copyright Notice | `/copyright` | `src/app/copyright/page.tsx` |

## Implementation

- **Footer:** `src/components/layout/SiteFooter.tsx` — copyright notice and links, shown on the landing page, app, admin, and platform pages
- **Signup:** a checkbox is required on `/signup` before account creation
- **Constants:** `src/lib/legal/constants.ts` — `© 2026 ReadShelf. All rights reserved.`

## Updating copy

Edit the page files listed above and bump the "Last updated" date. For an acquisition handover, buyers may replace the contact email and entity name in the constants file and legal pages.
