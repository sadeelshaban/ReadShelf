# ReadShelf

**Your personal digital reading shelf — PDFs, progress, highlights, and notes in one place.**

ReadShelf is a web app for keeping PDF books organized, readable, and annotated — without losing your place or your notes. Open it in your browser, build your shelf, and pick up where you left off from any device.

---

## The problem

If you read PDFs for study, work, or personal learning, you have probably run into the same friction:

- Files scattered across folders, WhatsApp, and cloud drives with no real **library**
- No reliable **reading progress** when you switch devices
- Highlights and notes trapped inside one app, or lost when you re-open the file elsewhere
- Generic PDF viewers that feel like tools, not a **personal shelf**
- Arabic and mixed-language PDFs that break when you try to **export** annotated copies

ReadShelf gives you a single private shelf where every book, bookmark, highlight, and note stays tied to your account.

---

## Features

### Library & shelf
- Email/password authentication (Supabase Auth)
- Upload PDF books (up to 50 MB) with cover generated from page 1
- Personal shelf with search and sort (**recent**, **date added**, **progress**)
- Per-book stats: reading progress and last page
- **Edit book details** (title and author) from the book page

### Reader
- Vertical scroll through all pages (stacked layout)
- Draggable annotation toolbar (select, pan, comment, highlighter, pen, **eraser**)
- Page navigation on the right: previous/next, **editable page number** (type a page and press Enter or click outside), zoom controls (default 50%)
- Freehand highlights, pen strokes, and positioned page notes
- Keyboard navigation (↑ / ↓ between pages)
- Progress saved automatically as you read
- Smooth scrolling without page flicker when moving between pages

### Annotations & export
- Highlights and notes stored per user, per book, per page
- Book details view with highlights and notes grouped by page (syncs local cache + database)
- **Download annotated PDF** — highlights and notes embedded on the original pages
- Arabic note text supported in export via embedded Noto Sans Arabic (TTF)

### Offline & sync
- IndexedDB cache for PDFs and annotations
- Offline reading after a book has been opened once online
- Background sync queue pushes local changes when connectivity returns

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth & database | Supabase (Auth, PostgreSQL, Row Level Security) |
| File storage | Supabase Storage (default) or Cloudflare R2 (optional) |
| PDF rendering | pdfjs-dist 6 (worker + cmaps + wasm + standard fonts) |
| PDF export | pdf-lib + @pdf-lib/fontkit |
| Offline | IndexedDB + custom sync queue |
| Deploy | Vercel-ready |

---

## Architecture overview

```
Browser (Next.js)
  ├── Shelf UI ──────────────► Supabase (auth, books, highlights, notes)
  ├── PDF Reader ────────────► pdfjs-dist + canvas overlay
  ├── Offline layer ─────────► IndexedDB (PDF cache, annotations, sync queue)
  └── Export ────────────────► Server route → pdf-lib annotated PDF

Storage
  ├── Supabase Storage  (default, ~1 GB free)
  └── Cloudflare R2     (optional, ~10 GB free — PDFs & covers only)
```

Each user's data is isolated with Supabase RLS policies. PDF files never appear in public URLs without signed access.

On `npm install`, a **postinstall** script copies pdf.js runtime assets (`pdf.worker`, `cmaps`, `wasm`, `iccs`, `standard_fonts`) into `public/` so scanned and Arabic PDFs render correctly in the browser.

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

`npm install` runs `postinstall` and copies pdf.js assets into `public/`. If pages render blank after deploy, run `node scripts/copy-pdf-worker.mjs` locally or redeploy after a fresh install.

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase keys.

### 3. Supabase setup

```bash
npm run setup:supabase
```

Apply migrations from `supabase/migrations/` in your Supabase SQL editor.

### 4. Optional: Cloudflare R2

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

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_*`, and optional `R2_*`).
4. Deploy — Vercel runs `npm install`, which triggers the pdf.js **postinstall** copy step.

After deploy:

- Add your Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs** (needed for password reset).
- Update R2 CORS `origins` to include your production domain.

---

## Project structure

```
src/
  app/                    # Next.js routes (landing, auth, shelf, reader, API)
  components/             # UI, shelf, reader, book, layout
  lib/
    supabase/             # Client, server, middleware
    storage/              # Supabase Storage + R2 abstraction
    pdf/                  # PDF loading, cover extraction, annotated export
    offline/              # IndexedDB, cache, sync queue
    reader/               # Coordinates, constants, hit-testing
    annotations/          # Merge local + server annotations
    books/                # Database queries
  types/                  # Shared TypeScript types
assets/
  fonts/                  # Noto Sans Arabic (PDF export)
supabase/
  migrations/             # SQL schema + RLS policies
scripts/                  # Supabase/R2 setup, pdf.js asset copy
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
| `npm run setup:r2` | Guided R2 setup |
| `npm run reset:data` | Wipe app data on linked Supabase project |

`postinstall` (automatic): `node scripts/copy-pdf-worker.mjs` — copies pdf.js worker, fonts, cmaps, wasm, and iccs into `public/`.

---

## Known limitations

- **PDF size limit:** 50 MB per upload (MVP)
- **Very large libraries:** Hundreds of pages load on demand; first visit to a distant page may take a moment to render
- **Storage:** Without R2, Supabase free tier storage is ~1 GB

---

## License

Private project — all rights reserved unless otherwise specified by the repository owner.

---

## Author

Built by **Sadeel Shaban** — a personal tool that became a product.

Questions or collaboration: [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)
