# Deployment Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| npm | 9+ |
| Supabase account | Free tier is fine for development |
| SMTP account | Gmail app password or SendGrid |
| Vercel account | For production hosting |

---

## 1. Clone and install

```bash
git clone https://github.com/sadeelshaban/ReadShelf.git
cd ReadShelf
npm install
```

`postinstall` copies the pdf.js worker, cmaps, and wasm files into `public/`.

---

## 2. Environment variables

Create `.env.local` (never commit this file):

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
```

| Variable | Where used |
|----------|------------|
| `NEXT_PUBLIC_*` | Browser + SSR |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin stats, signup emails — **server only** |
| `SMTP_*` | Auth email delivery |
| `ADMIN_EMAILS` | Admin route access |

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

Buckets `book-pdfs` and `book-covers` are created by migration 001, with RLS policies applied.

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
```

---

## 5. Production (Vercel)

1. Import the GitHub repo at [vercel.com](https://vercel.com)
2. Framework preset: **Next.js** (auto-detected)
3. Add all env vars from section 2 — use production values
4. Deploy

`vercel.json` sets the build/install commands; no custom rewrites are required.

### After the first deploy

1. Set `NEXT_PUBLIC_SITE_URL` to the production domain
2. Add the production callback URL in Supabase
3. Test the signup email (check the spam folder)
4. Verify `/favicon.png` and `/logo.png` load correctly (brand assets in `public/`)

### Custom domain

1. Vercel → Project → Domains → Add domain
2. Update DNS per Vercel's instructions
3. Update `NEXT_PUBLIC_SITE_URL` and the Supabase redirect URLs
4. Redeploy

---

## 6. Build verification

```bash
npm run build
npm run start
```

---

## 7. Rollback

**Vercel:** Deployments → previous deployment → **Promote to Production**

**Database:** restore a Supabase backup (Pro plan) or reverse the migration manually

---

## 8. Monitoring

| What | How |
|------|-----|
| Build errors | Vercel deployment logs |
| Runtime errors | Vercel Functions logs |
| Database | Supabase dashboard → Logs |
| Usage | Admin `/admin` engagement stats |
| Uptime | Vercel status or an external ping (optional) |

---

## 9. Security checklist before go-live

- [ ] `.env.local` is not committed to git
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only present in server environments
- [ ] RLS is enabled on all tables (handled by the migrations)
- [ ] Storage buckets are private, with signed URLs
- [ ] `ADMIN_EMAILS` is set to trusted addresses only
- [ ] SMTP credentials are rotated from development values
