# Backup Strategy

How ReadShelf data is protected, and how buyers should operate backups after acquisition.

## What must be backed up

| Asset | Location | Priority |
|-------|----------|----------|
| User accounts & auth | Supabase Auth | Critical |
| Library metadata, annotations | Supabase PostgreSQL | Critical |
| PDF files & covers | Supabase Storage (`book-pdfs`, `book-covers`) | Critical |
| Application source | Git repository | Critical |
| Environment configuration | Vercel + a secure vault (not in git) | Critical |
| IndexedDB offline cache | User devices only | Not server-backed |

## Supabase (database)

| Plan | Backup capability |
|------|-------------------|
| Free | Manual SQL export via dashboard or `pg_dump` |
| Pro | Daily automated backups (7-day retention by default, configurable) |
| Team / Enterprise | Point-in-time recovery (PITR) |

**Recommendation for production:** Supabase Pro or higher with PITR enabled before meaningful user load.

### Manual export (any plan)

```bash
npx supabase db dump --linked -f backup-$(date +%Y%m%d).sql
```

Store dumps encrypted, off-site (S3, R2, or the buyer's backup vault).

## Supabase Storage (PDFs)

Supabase does not version bucket objects by default. Options:

1. **Periodic bucket sync** — mirror `book-pdfs` and `book-covers` to a second region or provider (e.g. `rclone`, the AWS CLI, or a scheduled worker)
2. **Application-level delete safety** — book deletion removes storage objects, so buyers should test restore before relying on backups
3. **Migration scripts** — `npm run migrate:r2-to-supabase` (`scripts/migrate-r2-to-supabase.mjs`) for one-time object copy from Cloudflare R2 into Supabase Storage

## Application & configuration

| Item | Backup method |
|------|---------------|
| Source code | GitHub (tag releases before major changes) |
| Vercel env vars | Export via the Vercel dashboard or Infrastructure-as-Code |
| Supabase migrations | Versioned in `supabase/migrations/` |

## Recovery objectives (suggested targets)

| Scenario | RTO | RPO |
|----------|-----|-----|
| Bad deploy | < 15 min | 0 (Vercel rollback) |
| Database corruption | < 4 hours | 24 hours (daily backup) |
| Storage bucket loss | < 24 hours | Last mirror sync |

Adjust targets based on the buyer's SLA and Supabase plan.

## Rollback procedures

- **Application:** Vercel → Deployments → Promote a previous deployment ([Deployment guide](./deployment.md#7-rollback))
- **Database:** restore a Supabase backup, or replay migration reverse scripts
- **Storage:** restore from a secondary mirror; re-link `pdf_path` / `cover_path` if paths are unchanged

## Testing backups

Buyers should run a **quarterly restore drill**:

1. Restore a database dump to a staging Supabase project
2. Verify RLS and a sample user login
3. Confirm signed-URL access to a test PDF in the storage mirror

Document results in the buyer's internal runbook.
