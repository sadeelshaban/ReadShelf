# ReadShelf

A personal PDF shelf in the browser. Upload books, read them, highlight and annotate pages, and pick up exactly where you left off — including offline.

**Live:** [readshelf-rust.vercel.app](https://readshelf-rust.vercel.app)

## Features

- Email and password accounts, with password reset
- Personal shelf: upload a PDF (up to 50 MB), search, sort, and edit title or author
- Reading lists for grouping books from the shelf
- Continuous-scroll PDF reader with zoom, pan, highlight, pen, eraser, shapes, notes, and bookmarks
- Reading position, zoom, and progress saved automatically
- Annotated PDF export, including Arabic text
- Offline reading after a book has been opened once, with changes synced when you are back online
- Admin dashboard for usage stats and account management

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Auth and database | Supabase Auth, PostgreSQL, Row Level Security |
| Files | Cloudflare R2 (PDFs and covers). Supabase Storage is still supported |
| PDF | pdfjs-dist for reading, pdf-lib for annotated export |
| Email | Nodemailer over SMTP |
| Offline | IndexedDB and a small sync queue |
| Tests | Vitest |
| Hosting | Vercel |

## Getting started

You need Node.js 20+, a Supabase project, and SMTP credentials for auth email.

```bash
git clone https://github.com/sadeelshaban/ReadShelf.git
cd ReadShelf
npm install
```

Create `.env.local` in the project root. Do not commit it.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | App URL (`http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Admin stats and account routes |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Auth email |
| `EMAIL_FROM` | From address, for example `ReadShelf <you@gmail.com>` |
| `ADMIN_EMAILS` | Comma-separated admin emails (optional) |
| `STORAGE_PROVIDER` | `r2` or `supabase` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Required when storage is R2 |

Apply the SQL files in `supabase/migrations/` (SQL editor or `npx supabase db push`). In Supabase, under **Authentication → URL Configuration**, allow:

- `http://localhost:3000/auth/callback`
- your production `/auth/callback` URL

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run setup:supabase` can create the Supabase project and write `.env.local` on Windows if the Supabase CLI is logged in.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |
| `npm run setup:supabase` | Guided Supabase setup (Windows) |
| `npm run create:admin` | Create an admin user: `node scripts/create-admin-user.mjs <email> <password>` |
| `npm run setup:r2` | Guided Cloudflare R2 setup (Windows) |

`postinstall` copies the pdf.js worker and related assets into `public/`.

## Project structure

```
src/app/           Routes and API handlers
src/components/    Shelf, reader, lists, auth, admin
src/lib/           Supabase, storage, PDF, offline sync, email
supabase/migrations/  Database schema and RLS
scripts/           Setup and maintenance helpers
```

## Deploy

Import the repo in Vercel, set the environment variables above, and point `NEXT_PUBLIC_SITE_URL` at the production URL. Add that URL to the Supabase redirect allow list.

## Limits

- 50 MB per PDF upload
- Storage follows the Supabase or Cloudflare plan you use
- Signup and password reset need working SMTP
- The reader works on phones; annotation is more comfortable on a tablet or desktop
