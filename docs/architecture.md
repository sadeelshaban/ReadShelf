# Architecture

## Overview

ReadShelf is a **Next.js 16** full-stack application with a **Supabase** backend and an **IndexedDB** offline layer in the browser. Users authenticate via Supabase Auth, store PDFs in Supabase Storage, and read/annotate in a canvas-based PDF viewer (`pdfjs-dist`).

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
├─────────────────────────────────────────────────────────────────┤
│  Next.js App Router (React 19)                                   │
│    ├── Landing / Auth / Shelf / Book details / Reader            │
│    ├── Admin dashboard                                           │
│    └── API routes (serverless on Vercel)                         │
│                                                                  │
│  PDF Reader (PdfReader.tsx)                                      │
│    ├── pdfjs-dist → canvas page render                           │
│    ├── Overlay canvases → highlights, pen strokes                │
│    └── DOM notes + bookmark ribbons                              │
│                                                                  │
│  Offline layer (IndexedDB "readshelf")                           │
│    ├── books, pdfs, highlights, notes, bookmarks                 │
│    └── syncQueue → replay on reconnect                           │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
     ┌──────────────────┐         ┌──────────────────────┐
     │  Supabase Auth     │         │  Supabase Storage    │
     │  + PostgreSQL      │         │  book-pdfs           │
     │  (RLS per user)    │         │  book-covers         │
     └──────────────────┘         └──────────────────────┘
                │
                ▼
     ┌───────────────────┐
     │  SMTP (Nodemailer) │  ← signup confirm, password reset
     └───────────────────┘
```

## Request flows

### Upload book

1. Client requests signed upload URLs → `POST /api/books/upload-urls`
2. Client uploads PDF + cover directly to Supabase Storage
3. Client registers the book row → `POST /api/books/upload-file`
4. Book metadata is cached in IndexedDB

### Read & annotate

1. `ReadPageClient` loads the book + annotations from Supabase (or cache offline)
2. `PdfReader` renders pages on demand with a buffer window
3. Highlights, notes, and bookmarks are written to IndexedDB immediately
4. Changes are enqueued in `syncQueue` and flushed when online via `flushSyncQueue()`
5. Reading progress is saved on scroll, page change, idle (5s), and tab hide

### Resume reading

- **In progress:** `reading_scroll_y`, `reading_zoom`, and `last_page` are restored; Continue Reading modal appears
- **Completed (100%):** Read Again modal appears; `read_count` tracks completions

### Export annotated PDF

1. Client → `POST /api/books/[id]/pdf/export`
2. Server loads the original PDF from Storage and merges highlights/notes via `pdf-lib`
3. Embeds Noto Sans Arabic for RTL note text
4. Returns a downloadable PDF stream

## Security model

| Layer | Mechanism |
|-------|-----------|
| Database | Supabase RLS — `auth.uid() = user_id` on all user tables |
| Storage | Private buckets with signed URLs and expiry |
| Admin | `ADMIN_EMAILS` env var + `SUPABASE_SERVICE_ROLE_KEY` (server only) |
| Secrets | `.env.local` / Vercel env vars — never committed to git |

## Key modules

| Path | Responsibility |
|------|----------------|
| `src/lib/supabase/` | Browser, server, middleware, and service-role clients |
| `src/lib/offline/` | IndexedDB stores, sync queue, reader API |
| `src/lib/pdf/` | PDF loading, cover extraction, annotated export |
| `src/lib/reader/` | Coordinates, stroke erase, bookmarks |
| `src/lib/admin/` | Platform and engagement stats |
| `src/components/reader/PdfReader.tsx` | Core reader UI and annotation engine |

## Offline sync strategy

1. **Optimistic writes** — the UI updates immediately; local IndexedDB is the source of truth while offline
2. **Sync queue** — `{ entity, op, recordId, payload }` persisted per pending change
3. **Deduplication** — book-progress updates collapse to one pending item per book
4. **Merge** — annotations are merged by ID when reconciling server and local state (`mergeAnnotationsById`)
5. **Conflict resolution** — last-write-wins per record, which is suitable for a single-user-per-account model

## Deployment topology

```
GitHub (main) → Vercel (Next.js SSR + API routes)
                    ↓
              Supabase Cloud (Auth + Postgres + Storage)
                    ↓
              SMTP provider (Gmail, SendGrid, etc.)
```

## Scalability notes

- PDF rendering is **client-side** — server cost scales with API and export usage, not reading time
- Page rendering uses a **windowed** approach (current page ± buffer) for large books
- Storage grows with uploaded PDFs; Supabase plan limits apply
- The service role key is used only for admin stats and auth email routes — never per request
