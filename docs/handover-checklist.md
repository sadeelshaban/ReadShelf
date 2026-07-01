# Handover Checklist

Use this checklist when transferring ReadShelf to a buyer.

---

## Pre-handover (seller)

- [ ] Confirm latest `main` deployed to production
- [ ] All 7 migrations applied on production Supabase
- [ ] Logo assets present (`public/logo.png`, `public/favicon.png`)
- [ ] Data Room docs complete in `docs/`
- [ ] Demo video recorded and linked from `/platform` (optional)
- [ ] Remove seller personal accounts or transfer ownership
- [ ] Export anonymized analytics screenshot from `/admin`

---

## Repository transfer

- [ ] Transfer GitHub repo OR grant buyer admin access
- [ ] Confirm `.env.local` is **not** in repository
- [ ] Provide env var template (see `docs/deployment.md`)
- [ ] Document any fork-specific branches or tags

---

## Supabase handover

- [ ] Add buyer as Organization owner OR transfer project
- [ ] Provide: project URL, anon key, service role key
- [ ] Buyer rotates service role key after transfer
- [ ] Verify RLS policies active (Table Editor → Policies)
- [ ] Confirm storage buckets `book-pdfs`, `book-covers` exist
- [ ] Update Auth redirect URLs to buyer domain

---

## Vercel handover

- [ ] Transfer project to buyer team OR redeploy from buyer's Vercel account
- [ ] Buyer sets all environment variables
- [ ] Configure custom domain (if applicable)
- [ ] Verify production build succeeds

---

## SMTP / email

- [ ] Transfer SMTP credentials OR buyer creates new account
- [ ] Update `SMTP_*` and `EMAIL_FROM` in Vercel
- [ ] Send test signup + password reset emails
- [ ] Update `EMAIL_FROM` domain SPF/DKIM if using custom domain

---

## Admin access

- [ ] Set `ADMIN_EMAILS` to buyer admin addresses
- [ ] Run `npm run create:admin` for buyer admin user (if needed)
- [ ] Verify `/admin` loads platform + engagement stats

---

## Buyer verification (acceptance)

- [ ] Sign up new test user on production
- [ ] Upload PDF, read, highlight, note, bookmark
- [ ] Close and reopen — Continue Reading works
- [ ] Complete book to 100% — Read Again prompt appears
- [ ] Export annotated PDF
- [ ] Test offline: open book online, go offline, annotate, reconnect
- [ ] Admin dashboard shows correct counts

---

## Post-handover support (negotiate)

| Item | Typical |
|------|---------|
| Bug fixes (30 days) | Included in acquisition |
| Deployment walkthrough | 1–2 sessions |
| Custom branding | Separate scope |
| Stripe / billing integration | Separate scope |

---

## Contact

Seller: [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)
