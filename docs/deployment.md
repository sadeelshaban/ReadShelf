# Deployment Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm | 9+ |
| Supabase account | Free tier OK for dev |
| SMTP account | Gmail app password or SendGrid |
| Vercel account | For production hosting |

---

## 1. Clone and install

```bash
git clone https://github.com/sadeelshaban/ReadShelf.git
cd ReadShelf
npm install
```

`postinstall` copies pdf.js worker, cmaps, and wasm into `public/`.

---

## 2. Environment variables

Create `.env.local` (never commit):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=eyJ...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=app-password
EMAIL_FROM=ReadShelf <your@gmail.com>

ADMIN_EMAILS=admin@yourcompany.com

# Optional — Plausible traffic in /admin
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=readshelf-rust.vercel.app
PLAUSIBLE_API_KEY=
PLAUSIBLE_SITE_ID=readshelf-rust.vercel.app
```

| Variable | Where used |
|----------|------------|
| `NEXT_PUBLIC_*` | Browser + SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin stats, signup emails — **server only** |
| `SMTP_*` | Auth email delivery |
| `ADMIN_EMAILS` | Admin route access |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible tracking script (all pages) |
| `PLAUSIBLE_API_KEY` | Plausible Stats API (admin traffic cards) |
| `PLAUSIBLE_SITE_ID` | Plausible site id (optional; defaults to domain) |

---

## 3. Supabase setup

### Apply migrations

Run all files in `supabase/migrations/` in order (001 → 007), or:

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

### Auth URLs

In **Authentication → URL Configuration**:

| Type | URL |
|------|-----|
| Site URL | `https://your-domain.com` |
| Redirect | `https://your-domain.com/auth/callback` |
| Redirect (dev) | `http://localhost:3000/auth/callback` |

Enable **email confirmations**.

### Storage

Buckets `book-pdfs` and `book-covers` are created by migration 001 with RLS policies.

---

## 4. Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Helper scripts (Windows)

```bash
npm run setup:supabase      # Guided Supabase setup
npm run create:admin        # Create admin user
npm run create:demo         # Demo user for walkthroughs
npm run seed:demo           # Sample books on demo shelf
```

---

## 5. Production (Vercel)

1. Import GitHub repo in [vercel.com](https://vercel.com)
2. Framework preset: **Next.js** (auto-detected)
3. Add all env vars from section 2 — use production URLs
4. Deploy

`vercel.json` sets build/install commands. No custom rewrites required.

### After first deploy

1. Set `NEXT_PUBLIC_SITE_URL` to production domain
2. Add production callback URL in Supabase
3. Test signup email (check spam folder)
4. Verify `/favicon.png` and `/logo.png` load (brand assets in `public/`)

### Custom domain

1. Vercel → Project → Domains → Add domain
2. Update DNS per Vercel instructions
3. Update `NEXT_PUBLIC_SITE_URL` and Supabase redirect URLs
4. Redeploy

---

## 6. Build verification

```bash
npm run build
npm run start
```

---

## 7. Rollback

Vercel: Deployments → previous deployment → **Promote to Production**.

Database: restore Supabase backup (Pro plan) or reverse migration manually.

---

## 8. Monitoring

| What | How |
|------|-----|
| Build errors | Vercel deployment logs |
| Runtime errors | Vercel Functions logs |
| Database | Supabase dashboard → Logs |
| Usage | Admin `/admin` engagement stats |
| Uptime | Vercel status or external ping (optional) |

---

## 9. Security checklist before go-live

- [ ] `.env.local` not in git
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in server env
- [ ] RLS enabled on all tables (migrations handle this)
- [ ] Storage buckets private with signed URLs
- [ ] `ADMIN_EMAILS` set to trusted addresses only
- [ ] SMTP credentials rotated from dev values
