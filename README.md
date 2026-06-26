# ReadShelf

**Your personal digital reading shelf — PDFs, progress, highlights, and notes in one place.**

[Live app](https://readshelf-rust.vercel.app) · [Platform overview](https://readshelf-rust.vercel.app/platform) (for acquisition)

ReadShelf is a web app for people who read PDFs for study, work, or personal learning. Upload books to your private shelf, read in the browser, annotate page by page, and pick up exactly where you left off from any device. Everything stays tied to your account: covers, progress, highlights, and notes.

---

## The idea

Most PDF workflows feel scattered. Files live in folders, WhatsApp threads, or cloud drives with no real library. Progress does not follow you between devices. Highlights and notes get lost when you reopen the file somewhere else.

ReadShelf is built around one simple concept: **a calm, personal shelf** where each book keeps its place, its cover, and everything you wrote on it.

Organize → Read → Annotate. That is the whole flow.

---

## Features

### Account & auth
- Sign up with email and password (Supabase Auth)
- Email confirmation via custom SMTP (confirmation link in your inbox)
- Log in with clear field-level errors (wrong email, wrong password, unconfirmed account)
- Forgot password with a one-time code sent by email, then reset on a secure page
- After signup: reminder to check inbox (and spam if the email is missing)

### Library & shelf
- Upload PDF books (up to 50 MB) with an auto-generated cover from page 1
- Personal shelf with search and sort (**recent**, **date added**, **progress**)
- Per-book stats: reading progress and last page
- Edit title and author from the book page

### Reader
- Vertical scroll through all pages
- Draggable annotation toolbar: select, pan, comment, highlighter, pen, eraser
- Page navigation: previous/next, editable page number, zoom (default 50%)
- Freehand highlights, pen strokes, and positioned page notes
- Keyboard navigation (↑ / ↓ between pages)
- Progress saved automatically as you read

### Annotations & export
- Highlights and notes stored per user, per book, per page
- Book details view with Highlights and Notes tabs grouped by page
- Download annotated PDF with highlights and notes embedded on the original pages
- Arabic note text supported in export via embedded Noto Sans Arabic

### Offline & sync
- IndexedDB cache for PDFs and annotations
- Offline reading after a book has been opened once online
- Background sync when connectivity returns

### Admin (optional)
- Dashboard at `/admin` for emails listed in `ADMIN_EMAILS`
- Platform stats: users, books, notes, highlights
- User management: sign out or delete accounts
- Admins land on the dashboard after login; regular users go to their shelf

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & database | Supabase (Auth, PostgreSQL, Row Level Security) |
| File storage | Supabase Storage |
| Auth emails | Nodemailer + your SMTP (e.g. Gmail app password) |
| PDF rendering | pdfjs-dist 6 (worker + cmaps + wasm + standard fonts) |
| PDF export | pdf-lib + @pdf-lib/fontkit |
| Offline | IndexedDB + custom sync queue |
| Deploy | Vercel |

---

## Architecture

```
Browser (Next.js)
  ├── Auth UI ───────────────► Supabase Auth + custom SMTP emails
  ├── Shelf UI ──────────────► Supabase (books, highlights, notes)
  ├── PDF Reader ────────────► pdfjs-dist + canvas overlay
  ├── Offline layer ─────────► IndexedDB (PDF cache, annotations, sync queue)
  └── Export ────────────────► Server route → pdf-lib annotated PDF

Storage
  └── Supabase Storage (PDFs & covers, signed access)
```

Each user's data is isolated with Supabase RLS. PDF files are not served from public URLs without signed access.

On `npm install`, **postinstall** copies pdf.js runtime assets (`pdf.worker`, `cmaps`, `wasm`, `iccs`, `standard_fonts`) into `public/` so scanned and Arabic PDFs render correctly.

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- SMTP credentials for auth emails (Gmail with an [app password](https://support.google.com/accounts/answer/185833) works well)

### 1. Clone and install

```bash
git clone https://github.com/sadeelshaban/ReadShelf.git
cd ReadShelf
npm install
```

If PDF pages render blank after deploy, run `node scripts/copy-pdf-worker.mjs` or redeploy after a fresh install.

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | App URL (e.g. `http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; required for signup emails and admin stats |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Send confirmation and password-reset emails |
| `EMAIL_FROM` | From address (e.g. `ReadShelf <you@gmail.com>`) |
| `ADMIN_EMAILS` | Comma-separated admin emails (optional) |

### 3. Supabase setup

```bash
npm run setup:supabase
```

Apply migrations from `supabase/migrations/` in the Supabase SQL editor. Email templates live in `supabase/templates/` and are loaded by the app when sending mail.

In Supabase **Authentication → URL Configuration**, add your site URL and redirect URLs:

- `https://your-domain.com/auth/callback`
- `http://localhost:3000/auth/callback` (local dev)

Enable email confirmations in Supabase Auth settings.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables from `.env.local.example` (including SMTP and `SUPABASE_SERVICE_ROLE_KEY`).
4. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://readshelf-rust.vercel.app`).
5. Deploy. Vercel runs `npm install`, which triggers the pdf.js postinstall copy.

After deploy:

- Add your production URL to Supabase **Redirect URLs**.
- Send a test signup to confirm confirmation emails arrive (check spam if needed).

---

## Project structure

```
src/
  app/                    # Routes: landing, auth, shelf, reader, admin, API
  components/             # UI, shelf, reader, book, auth, admin, layout
  lib/
    supabase/             # Client, server, middleware, service role
    storage/              # Supabase Storage uploads and signed URLs
    email/                # SMTP send, templates, signup/recovery links
    pdf/                  # PDF loading, cover extraction, annotated export
    offline/              # IndexedDB, cache, sync queue
    reader/               # Coordinates, constants, hit-testing
    annotations/          # Merge local + server annotations
    books/                # Database queries
    admin/                # Stats and user management
  types/                  # Shared TypeScript types
assets/
  fonts/                  # Noto Sans Arabic (PDF export)
supabase/
  migrations/             # SQL schema + RLS policies
  templates/              # HTML email templates (confirmation, recovery OTP)
scripts/                  # Supabase setup, pdf.js asset copy, admin helpers
public/                   # Icons, favicon, pdf.js worker + cmaps + wasm (generated)
```

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup:supabase` | Guided Supabase setup (Windows) |
| `npm run apply:supabase-auth` | Apply Supabase auth configuration |
| `npm run create:admin` | Create an admin user |
| `npm run create:demo` | Create a confirmed demo user for acquisition walkthroughs |
| `npm run reset:data` | Wipe app data on linked Supabase project |

`postinstall` (automatic): `node scripts/copy-pdf-worker.mjs`

---

## Known limitations

- **PDF size limit:** 50 MB per upload
- **Very large books:** Distant pages load on demand; first visit may take a moment
- **Storage:** Supabase free tier storage is ~1 GB
- **Auth emails:** Require working SMTP; without it, signup cannot send confirmation mail

---

## Product acquisition

ReadShelf is available as a **full product acquisition** for EdTech, publishers, agencies, and internal knowledge teams.

- **One-pager:** [/platform](https://readshelf-rust.vercel.app/platform)
- **Live demo:** production deployment with shelf, reader, annotations, and admin analytics
- **Demo user:** `npm run create:demo` (confirmed account for buyer walkthroughs)
- **Contact:** [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)

What's included: source code, Supabase schema, deployment, admin dashboard with engagement analytics, and handover support.

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.

---

## Author

Built by **Sadeel Shaban** — a personal reading tool turned into a product.

Questions or collaboration: [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)
