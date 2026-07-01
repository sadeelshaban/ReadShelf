# ReadShelf

**Production-ready PDF reading platform — private libraries, annotations, progress sync, and offline support.**

| | |
|---|---|
| **Live demo** | [readshelf-rust.vercel.app](https://readshelf-rust.vercel.app) |
| **Acquisition one-pager** | [/platform](https://readshelf-rust.vercel.app/platform) |
| **Data Room (docs)** | [docs/README.md](./docs/README.md) |
| **Contact** | [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com) |

ReadShelf is a full-stack web product for reading PDF books in the browser. Users upload books to a personal shelf, annotate page by page, resume exactly where they left off, and export annotated PDFs. Built on Next.js, Supabase, and a custom offline layer — deployable on Vercel in under an hour.

**Available as a complete product acquisition** for EdTech companies, publishers, corporate training teams, and agencies that need a white-label reading solution without building from scratch.

---

## Executive summary

| | |
|---|---|
| **Product type** | B2B / B2C PDF reading & annotation SaaS (white-label ready) |
| **Status** | Production-deployed, actively maintained codebase |
| **Stack** | Next.js 16 · React 19 · TypeScript · Supabase · Vercel |
| **Differentiators** | Offline-first sync, Arabic PDF export, reading resume (scroll + zoom), bookmarks, engagement analytics |
| **Delivery** | Full source, 7 SQL migrations, deployment docs, handover support |

---

## Who this is for

| Buyer | Use case |
|-------|----------|
| **EdTech & course platforms** | Private student shelves for textbooks, handouts, and course PDFs with progress tracking |
| **Publishers** | Branded reading experience with highlights, notes, bookmarks, and annotated export |
| **Corporate L&D / knowledge teams** | Centralized manuals, SOPs, and training PDFs per employee |
| **Development agencies** | White-label base to ship a reading product for clients in weeks, not months |

---

## Feature overview

### Authentication & onboarding
- Email/password signup with Supabase Auth
- Custom SMTP confirmation emails (Nodemailer + HTML templates)
- Login with field-level error messages
- Forgot password via one-time email code
- Post-signup inbox/spam reminder
- Role-based routing: admins → dashboard, users → shelf

### Personal library (shelf)
- Upload PDFs up to **50 MB** with auto-generated cover from page 1
- Search by title or author; sort by **recent**, **date added**, or **progress**
- Book cards with aligned page counts and hover progress preview
- Edit title and author from book details
- Delete book (removes PDF, cover, annotations, bookmarks, and local cache)

### PDF reader
- Vertical continuous scroll through all pages
- Draggable toolbars: select, pan, highlight, pen, eraser, note, bookmark
- Page navigation: prev/next, editable page field, zoom (25%–400%)
- Freehand highlights and pen strokes with adjustable stroke width
- Positioned page notes with color and font size controls
- Undo/redo for annotations
- Keyboard navigation (↑ / ↓ between pages)
- Touch-friendly controls

### Reading session & progress
- **Auto-save** page, scroll position, and zoom while reading
- **Continue Reading** modal on return — restores exact spot (not just page number)
- **Read Again** flow when a book reaches **100%** progress
- **Read count** tracked per book (increments on each completion)
- Progress bar and last-page tracking on shelf and details

### Bookmarks
- Manual bookmarks separate from auto-saved position
- Color-coded ribbons (yellow, blue, red) on the page edge
- Optional one-word label per bookmark
- Add panel from toolbar; double-click ribbon to delete (Yes/No confirm)
- Bookmarks tab on book details with jump-to-page links
- Offline sync for bookmarks

### Book details page
- Cover, title, author, page count, date added
- **Last opened:** human-readable timestamp (e.g. *Yesterday 9:43 PM*)
- **Read count:** *Read once* / *Read 3 times* after completions
- Tabs: **Highlights**, **Notes**, **Bookmarks** — grouped by page, linked to reader
- Download original or **annotated PDF** export

### Annotated PDF export
- Server-side export embeds highlights and notes on original pages
- **Arabic text** supported via embedded Noto Sans Arabic
- Preserves layout and page structure

### Offline & sync
- IndexedDB cache for PDFs, books metadata, highlights, notes, and bookmarks
- Read offline after opening a book once online
- Custom sync queue replays pending changes when connectivity returns
- Conflict-safe merge for annotations

### Admin dashboard (`/admin`)
- Platform stats: users, books, notes, highlights
- **Engagement analytics:** average progress, completion rate, active readers (30d), books opened (7d), annotations per book
- User management: sign out or delete accounts
- Gated by `ADMIN_EMAILS` environment variable

### Acquisition
- Public **[/platform](https://readshelf-rust.vercel.app/platform)** one-pager for buyers
- `npm run create:admin` — admin account setup

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & database | Supabase (Auth, PostgreSQL, Row Level Security) |
| File storage | Supabase Storage (signed URLs) |
| Auth emails | Nodemailer + SMTP (Gmail app password works) |
| PDF rendering | pdfjs-dist 6 (worker, cmaps, wasm, standard fonts) |
| PDF export | pdf-lib + @pdf-lib/fontkit |
| Offline | IndexedDB + custom sync queue |
| Deploy | Vercel |

---

## Architecture

```
Browser (Next.js)
  ├── Auth UI ──────────────► Supabase Auth + custom SMTP emails
  ├── Shelf UI ─────────────► Supabase (books, highlights, notes, bookmarks)
  ├── PDF Reader ───────────► pdfjs-dist + canvas annotation layers
  ├── Offline layer ────────► IndexedDB (PDF cache, annotations, sync queue)
  ├── Export API ───────────► pdf-lib annotated PDF generation
  └── Admin ────────────────► Service role stats + user management

Storage
  └── Supabase Storage (PDFs & covers, signed access only)
```

- **Row Level Security** on every user table — data isolated per account
- PDFs never exposed via public URLs; signed access only
- Secrets in Vercel env vars / `.env.local` — never committed to git
- `postinstall` copies pdf.js runtime assets into `public/` for correct Arabic and scanned PDF rendering

---

## Database schema

| Table | Purpose |
|-------|---------|
| `books` | Library entries: PDF path, cover, progress, scroll/zoom position, read count |
| `highlights` | Freehand and text highlights with JSON position data |
| `notes` | Page notes with position, color, font size |
| `bookmarks` | Manual page bookmarks with label and color |
| `profiles` | User profile metadata, presence (`last_seen_at`) |

**Migrations** (apply in order): `supabase/migrations/001` → `007`

Key `books` fields beyond basics:
- `reading_scroll_y`, `reading_zoom` — precise resume position
- `read_count` — number of times the book was completed (100%)

---

## What's included in an acquisition

- Full Next.js source code (TypeScript, ~40 routes and API endpoints)
- 7 Supabase SQL migrations with RLS policies
- HTML email templates (confirmation, password recovery)
- Production Vercel deployment configuration
- Admin dashboard with engagement analytics
- Offline sync layer (IndexedDB + queue)
- Platform acquisition page (`/platform`)
- Handover support and deployment walkthrough

**Not included:** Supabase/Vercel hosting costs, SMTP account, custom branding beyond white-labeling, or ongoing maintenance and feature development (negotiable separately). A **30-day post-close window for critical bug fixes in delivered code** may be included in acquisition — see [Handover Checklist](./docs/handover-checklist.md#post-handover-support-negotiate); that is not general maintenance.

---

## Data Room (due diligence)

Canonical index: **[docs/README.md](./docs/README.md)** — architecture, ERD, database, API, deployment, security, backup, roadmap, costs, analytics, branding, handover, and legal pages.

---

## Branding

Logo files: `public/logo.png` (UI) and `public/favicon.png` (browser tab + emails).  
See [docs/branding.md](./docs/branding.md) for palette, fonts, and white-label steps.

---

## Evaluate before you buy

1. Open the **[live site](https://readshelf-rust.vercel.app)** and create an account, or email for a guided walkthrough.
2. Upload a PDF, read a few pages, add highlights, a note, and a bookmark.
3. Close the tab and reopen — confirm **Continue Reading** restores your position.
4. Visit **book details** — check Last opened, progress, and annotation tabs.
5. Export an annotated PDF and verify highlights appear.
6. Review **[/platform](https://readshelf-rust.vercel.app/platform)** and the admin analytics (admin access available on request).
7. Email **[sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)** for source access, pricing, and handover terms.

---

## Getting started (developer setup)

### Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project (free tier works)
- SMTP credentials for auth emails

### Install

```bash
git clone https://github.com/sadeelshaban/ReadShelf.git
cd ReadShelf
npm install
```

### Environment variables

Create `.env.local` in the project root (**never commit this file**):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | App URL (`http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; admin stats and signup emails |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Auth email delivery |
| `EMAIL_FROM` | From address (e.g. `ReadShelf <you@gmail.com>`) |
| `ADMIN_EMAILS` | Comma-separated admin emails (optional) |

### Supabase

```bash
npm run setup:supabase
```

Apply all files in `supabase/migrations/` via Supabase SQL editor or `npx supabase db push`.

In **Authentication → URL Configuration**, add:
- `https://your-domain.com/auth/callback`
- `http://localhost:3000/auth/callback`

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Add all environment variables from the table above.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Deploy — `postinstall` copies pdf.js assets automatically.
5. Add production URL to Supabase redirect URLs.
6. Send a test signup to verify email delivery.

---

## Project structure

```
src/
  app/                    # Routes: landing, auth, shelf, reader, admin, platform, API
  components/             # UI, shelf, reader, book, auth, admin, layout
  lib/
    supabase/             # Client, server, middleware, service role
    storage/              # Supabase Storage uploads and signed URLs
    email/                # SMTP send and HTML templates
    pdf/                  # PDF loading, cover extraction, annotated export
    offline/              # IndexedDB, cache, sync queue, bookmarks store
    reader/               # Coordinates, bookmarks, stroke/erase logic
    books/                # Queries and reading-stats formatting
    admin/                # Platform and engagement stats
    annotations/          # Merge local + server annotations
  types/                  # Shared TypeScript types
assets/fonts/             # Noto Sans Arabic (PDF export)
supabase/
  migrations/             # 001–007: schema + RLS
  templates/              # Email HTML templates
scripts/                  # Setup, pdf.js copy, admin helpers
public/                   # Icons, pdf.js worker + cmaps + wasm (generated)
```

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run setup:supabase` | Guided Supabase setup (Windows) |
| `npm run apply:supabase-auth` | Apply Supabase auth configuration |
| `npm run create:admin` | Create an admin user |
| `npm run reset:data` | Wipe app data on linked Supabase project |
| `npm run migrate:r2-to-supabase` | Optional: copy PDF objects from Cloudflare R2 into Supabase Storage |
| `npm run deploy:vercel` | Deploy helper (Windows) |

`postinstall` runs automatically: `node scripts/copy-pdf-worker.mjs`

---

## Security

- `.env.local` is **gitignored** — real keys never belong in the repository
- Production secrets live in **Vercel Environment Variables**
- Supabase **RLS** enforces per-user data isolation on all tables
- PDF access via **signed URLs** only
- Service role key used server-side only (admin, email routes)
- No hardcoded credentials in source or scripts

---

## Known limitations

| Limit | Detail |
|-------|--------|
| PDF upload size | 50 MB per file |
| Large books | Pages render on demand; first open may take a moment |
| Storage | Bounded by Supabase plan (~1 GB on free tier) |
| Auth emails | Require working SMTP; no email = no signup confirmation |
| Mobile | Reader works on mobile; annotation UX optimized for tablet/desktop |

---

## Licensing & acquisition

ReadShelf is offered as a **full product sale** — source code, database schema, deployment, and handover.

- **Inquiry:** [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com?subject=ReadShelf%20acquisition%20inquiry)
- **Overview:** [readshelf-rust.vercel.app/platform](https://readshelf-rust.vercel.app/platform)
- **License:** Private — all rights reserved unless otherwise agreed in writing

---

## Author

Built by **Sadeel Shaban**.

Questions or acquisition terms: [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)
