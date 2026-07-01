# Security Overview

Security posture for buyers performing technical due diligence on ReadShelf.

## Authentication & sessions

| Control | Implementation |
|---------|----------------|
| Identity provider | Supabase Auth (email/password) |
| Session cookies | HTTP-only, managed by the `@supabase/ssr` middleware |
| Password reset | One-time email code via a custom SMTP route |
| Admin access | `ADMIN_EMAILS` allowlist + server-only service role |

## Data isolation

- **Row-level security (RLS)** on all user tables — policies enforce `auth.uid() = user_id`
- **Private storage buckets** (`book-pdfs`, `book-covers`) — no public listing
- **Signed URLs** for PDF and cover reads, with short expiry
- **Service role key** used only in server routes (admin stats, auth emails) — never exposed to the browser

## Transport & application security

- HTTPS enforced in production (Vercel)
- API routes validate the session before mutating user data
- File uploads are restricted by content type and size in application logic
- Environment secrets live in `.env.local` / Vercel and are excluded from git via `.gitignore`

## Client-side storage

- IndexedDB caches PDFs and annotations for offline use, scoped to the logged-in browser profile
- The sync queue replays changes when connectivity returns; there is no cross-user data mixing

## Third-party processors

| Processor | Data handled |
|-----------|--------------|
| Supabase | Auth, PostgreSQL, object storage |
| Vercel | Hosting, serverless functions, request logs |
| SMTP provider | Transactional email (signup, password reset) |

See [Legal](./legal.md) for the Privacy Policy and international data transfer disclosure.

## Pre-go-live checklist

See the full checklist in the [Deployment guide](./deployment.md#9-security-checklist-before-go-live).

## Incident response (operator)

1. Rotate `SUPABASE_SERVICE_ROLE_KEY` and SMTP credentials if compromised
2. Review Supabase Auth logs and Vercel function logs
3. Invalidate sessions via the Supabase dashboard if account takeover is suspected
4. Document the incident and notify affected users as required by applicable law

## Hardening options for buyers

- Enable Supabase MFA for admin accounts
- Add rate limiting on auth routes (e.g. Vercel middleware or Upstash)
- Add WAF / bot protection via Cloudflare in front of Vercel
- Export SOC2-aligned logging from Supabase (Pro plan)
