# Handover Checklist

Use this checklist when transferring ReadShelf to a buyer.

---

## Pre-handover (seller)

- [ ] Confirm the latest `main` is deployed to production
- [ ] All 7 migrations are applied on the production Supabase project
- [ ] Logo assets are present (`public/logo.png`, `public/favicon.png`)
- [ ] Data Room docs are complete in `docs/`
- [ ] Demo video recorded and linked from `/platform` (optional)
- [ ] Remove seller personal accounts, or transfer ownership
- [ ] Export an anonymized analytics screenshot from `/admin`

---

## Repository transfer

- [ ] Transfer the GitHub repo, or grant the buyer admin access
- [ ] Confirm `.env.local` is **not** in the repository
- [ ] Provide the env var template (see [Deployment guide](./deployment.md))
- [ ] Document any fork-specific branches or tags

---

## Supabase handover

- [ ] Add the buyer as an Organization owner, or transfer the project
- [ ] Provide the project URL, anon key, and service role key
- [ ] Buyer rotates the service role key after transfer
- [ ] Verify RLS policies are active (Table Editor → Policies)
- [ ] Confirm the storage buckets `book-pdfs` and `book-covers` exist
- [ ] Update Auth redirect URLs to the buyer's domain

---

## Vercel handover

- [ ] Transfer the project to the buyer's team, or redeploy from the buyer's Vercel account
- [ ] Buyer sets all environment variables
- [ ] Configure a custom domain (if applicable)
- [ ] Verify the production build succeeds

---

## SMTP / email

- [ ] Transfer SMTP credentials, or have the buyer create a new account
- [ ] Update `SMTP_*` and `EMAIL_FROM` in Vercel
- [ ] Send test signup and password reset emails
- [ ] Update SPF/DKIM records if the buyer uses a custom `EMAIL_FROM` domain

---

## Admin access

- [ ] Set `ADMIN_EMAILS` to the buyer's admin addresses
- [ ] Run `npm run create:admin` for the buyer's admin user (if needed)
- [ ] Verify `/admin` loads platform and engagement stats correctly

---

## Buyer verification (acceptance)

- [ ] Sign up a new test user on production
- [ ] Upload a PDF, read it, add a highlight, a note, and a bookmark
- [ ] Close and reopen the app — confirm Continue Reading works
- [ ] Complete a book to 100% — confirm the Read Again prompt appears
- [ ] Export an annotated PDF
- [ ] Test offline mode: open a book online, go offline, annotate, then reconnect
- [ ] Confirm the admin dashboard shows correct counts

---

## Post-handover support (negotiate)

Terms below are **typical acquisition add-ons**, not part of the live SaaS Terms of Service. They are separate from **ongoing maintenance** (hosting, feature work, and general support after handover).

| Item | Typical scope |
|------|---------------|
| Critical bug fixes (30 days post-close) | Often included — **defects in delivered code only**, not new features or general maintenance |
| Ongoing maintenance & feature development | Separate written agreement |
| Deployment walkthrough | 1–2 sessions |
| Custom branding | Separate scope |
| Stripe / billing integration | Separate scope |

---

## Contact

Seller: [sadeelshabanmedia@gmail.com](mailto:sadeelshabanmedia@gmail.com)
