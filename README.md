# ReadShelf

**Your personal digital reading shelf — PDFs, progress, highlights, and notes in one place.**

ReadShelf is a **desktop-first** reading app (Windows installer via Electron) built to solve a real, everyday problem: keeping PDF books organized, readable, and annotated — without losing your place or your notes. It also runs in the browser for development and optional web hosting.

> **Mobile / PWA install is intentionally removed for now** and may return in a later release.

---

## The problem

If you read PDFs for study, work, or personal learning, you have probably run into the same friction:

- Files scattered across folders, WhatsApp, and cloud drives with no real **library**
- No reliable **reading progress** when you switch devices
- Highlights and notes trapped inside one app, or lost when you re-open the file elsewhere
- Generic PDF viewers that feel like tools, not a **personal shelf**
- Arabic and mixed-language PDFs that break when you try to **export** annotated copies

ReadShelf started as a solution to that personal workflow — a single private shelf where every book, bookmark, highlight, and note stays tied to your account and follows you wherever you open the app.

---

## The solution

ReadShelf gives you a focused reading environment:

| Need | How ReadShelf handles it |
|------|--------------------------|
| Organize PDFs | Upload to your private shelf with auto-generated cover art |
| Pick up where you left off | Reading progress syncs per book |
| Mark up content | Freehand highlights + positioned page notes |
| Work offline | PDFs and annotations cache locally; changes sync when back online |
| Keep a portable copy | Export a PDF with highlights and notes burned into the pages (Arabic-aware) |
| Run as a desktop app | Native Windows installer — full UI, offline cache, cloud sync |

The same Next.js app powers both the **desktop shell** and optional **web deploy**.

---

## Features

### Library & shelf
- Email/password authentication (Supabase Auth)
- Upload PDF books (up to 50 MB) with cover generated from page 1
- Personal shelf with search and sort (recent, title, progress)
- Per-book stats: progress, highlight count, note count

### Reader
- In-browser PDF reader with zoom and page navigation
- Freehand highlight strokes with color presets
- Draggable, resizable page notes with font size and text color
- Keyboard and trackpad navigation on desktop
- Progress saved automatically as you read

### Annotations & export
- Highlights and notes stored per user, per book, per page
- Book details view grouped by page
- **Download annotated PDF** — highlights and notes embedded on the original pages
- Arabic note text supported in export via embedded Noto Sans Arabic font

### Offline & sync
- IndexedDB cache for PDFs and annotations
- Offline reading after a book has been opened once online
- Background sync queue pushes local changes when connectivity returns

### Desktop app
- **Electron** shell with embedded Next.js server
- Windows `.exe` installer (NSIS)
- All web features: auth, shelf, reader, highlights, notes, export, offline sync
- Local-only server (`127.0.0.1`) — not exposed to the network

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & database | Supabase (Auth, PostgreSQL, Row Level Security) |
| File storage | Supabase Storage (default) or Cloudflare R2 (optional, recommended) |
| PDF rendering | pdfjs-dist |
| PDF export | pdf-lib + @pdf-lib/fontkit |
| Offline | IndexedDB + custom sync queue |
| Desktop | Electron 35 + electron-builder |
| Web deploy | Vercel-ready (optional) |

---

## Architecture overview

```
Desktop (Electron)
  ├── Embedded Next.js server (standalone build, localhost only)
  ├── Shelf UI ──────────────► Supabase (auth, books, highlights, notes)
  ├── PDF Reader ────────────► pdfjs-dist + canvas overlay
  ├── Offline layer ─────────► IndexedDB (PDF cache, annotations, sync queue)
  └── Export ────────────────► Server route → pdf-lib annotated PDF

Storage
  ├── Supabase Storage  (default, ~1 GB free)
  └── Cloudflare R2     (optional, ~10 GB free — PDFs & covers only)
```

Each user's data is isolated with Supabase RLS policies. PDF files never appear in public URLs without signed access.

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- Optional: [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket for larger libraries

### 1. Clone and install

```bash
git clone https://github.com/sadeelshaban/ReadShelf.git
cd ReadShelf
npm install
```

### 2. Supabase setup

**Create a project**

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Copy from **Project Settings → API**:
   - Project URL
   - `anon` public key

**Enable email auth**

1. **Authentication → Providers → Email** — enable Email.
2. For local dev, you may disable **Confirm email** so sign-up works immediately.

**Run the database migration**

1. Open **SQL Editor** in Supabase.
2. Run the contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
3. If bucket creation fails in SQL, create these buckets manually under **Storage**:
   - `book-pdfs` (private)
   - `book-covers` (private)

**Or use the setup script (Windows)**

```bash
npm run setup:supabase
```

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Minimum required:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Optional — Cloudflare R2

Supabase free storage is ~1 GB. For a larger personal library, point PDF/cover storage to R2:

```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=readshelf
```

Add CORS on the R2 bucket so browser uploads work:

```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["http://localhost:3000", "https://your-app.vercel.app"],
        "methods": ["PUT", "GET", "HEAD"],
        "headers": ["*"]
      },
      "exposeHeaders": ["ETag"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

Setup helpers:

```bash
npm run setup:r2        # guided setup
npm run setup:r2:auto   # Wrangler-based automated setup
npm run test:r2         # verify R2 connection
```

When all `R2_*` variables are set, new uploads go to R2 automatically. Auth and database stay on Supabase.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Desktop app (Windows)

ReadShelf uses **Electron** (not Flutter) so the existing Next.js app, API routes, PDF export, and Supabase integration stay intact — no rewrite required.

### Why Electron over Flutter?

| | Electron | Flutter |
|---|----------|---------|
| Reuse current code | ✅ Full Next.js app | ❌ Full rewrite |
| PDF reader + export | ✅ Already built | ❌ Rebuild from scratch |
| Supabase + R2 | ✅ Working | ❌ Reintegrate everything |
| Desktop installer | ✅ `.exe` via electron-builder | ✅ Yes, but months of work |

### Run desktop in development

Terminal 1 — or use the combined script:

```bash
npm run desktop:dev
```

This starts Next.js on `127.0.0.1:3000` and opens the Electron window.

### Build a Windows installer

1. Configure `.env.local` (Supabase + optional R2) — these values are bundled into the desktop build for personal use.
2. Build and package:

```bash
npm run desktop:pack
```

3. Find the installer under `dist/desktop/` (`.exe` NSIS installer).

The packaged app runs a local Next.js server on a random `127.0.0.1` port and loads it inside a native window. Your cloud data (Supabase + R2) stays online; only the app shell runs locally.

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_*`, and optional `R2_*`).
4. Deploy.

After deploy:

- Add your Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs** (needed for password reset).
- Update R2 CORS `origins` to include your production domain.

---

## Project structure

```
desktop/                  # Electron main + preload
src/
  app/                    # Next.js routes (landing, auth, shelf, reader, API)
  components/             # UI, shelf, reader, book, layout
  lib/
    supabase/             # Client, server, middleware
    storage/              # Supabase Storage + R2 abstraction
    pdf/                  # PDF loading, cover extraction, annotated export
    offline/              # IndexedDB, cache, sync queue
    reader/               # Coordinates, constants
    books/                # Database queries
  types/                  # Shared TypeScript types
supabase/
  migrations/             # SQL schema + RLS policies
scripts/                  # Supabase, R2, desktop bundle helpers
public/                   # Icons and favicon
```

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run desktop:dev` | Run Next.js + Electron desktop window |
| `npm run build:desktop` | Production build + bundle for Electron |
| `npm run desktop:pack` | Build Windows `.exe` installer |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup:supabase` | Guided Supabase setup (Windows) |
| `npm run setup:r2` | Guided R2 setup |
| `npm run reset:data` | Wipe app data on linked Supabase project |

---

## Known limitations

- **PDF size limit:** 50 MB per upload (MVP)
- **Scanned PDFs:** Image-only PDFs may not support text selection; highlights still work via freehand drawing
- **Storage:** Without R2, Supabase free tier storage is ~1 GB
- **UI polish:** Shelf and reader styling is functional but still being refined in v0.1

---

## Roadmap (v0.1 → next)

This is the **first public release**. Core reading, annotations, offline sync, and annotated PDF export are working end-to-end.

Planned improvements:

- [ ] UI/UX polish (shelf layout, reader toolbar)
- [ ] Final QA pass on edge cases (large PDFs, long Arabic notes, sync conflicts)
- [ ] Mobile / PWA install (deferred — desktop-first for now)
- [ ] Additional features based on real usage (collections, reading goals, sharing)

Contributions and feedback are welcome.

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.

---

## Author

Built by **Sadeel Shaban** — a personal tool that became a product.

Questions or collaboration: [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)
