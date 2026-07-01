# Analytics

## Plausible in the admin dashboard

ReadShelf can show **site traffic** in `/admin` via [Plausible Analytics](https://plausible.io) — useful for buyers who want proof of visits alongside product engagement metrics.

### Setup (3 steps)

1. **Create a Plausible site** at [plausible.io](https://plausible.io)  
   Use your Vercel URL as the domain, e.g. `readshelf-rust.vercel.app` (custom domain optional later).

2. **Add the tracking script** — set in Vercel / `.env.local`:

```env
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=readshelf-rust.vercel.app
```

This loads Plausible on all pages so visits are recorded.

3. **Show stats in admin** — create a Plausible API key (Settings → API keys) and add:

```env
PLAUSIBLE_API_KEY=your-api-key
PLAUSIBLE_SITE_ID=readshelf-rust.vercel.app
```

### What appears in `/admin`

| Card | Source |
|------|--------|
| Unique visitors | Plausible API (30d) |
| Pageviews | Plausible API |
| Visits | Plausible API |
| Bounce rate | Plausible API |

Stats refresh every 5 minutes (server cache). Product engagement (progress, completion) remains from Supabase below.

---

## Built-in engagement analytics

ReadShelf includes **database-derived analytics** in the admin dashboard (`/admin`). No third-party tracker is required for product usage metrics.

Source: `src/lib/admin/stats.ts`

### Platform stats

| Metric | Source |
|--------|--------|
| Total users | `profiles` count |
| Total books | `books` count |
| Total notes | `notes` count |
| Total highlights | `highlights` count |

### Engagement stats

| Metric | Calculation |
|--------|-------------|
| **Avg progress %** | Mean of `books.progress_percent` |
| **Completion rate** | % of books with progress ≥ 90% |
| **Completed books** | Count where progress ≥ 90% |
| **Active readers (30d)** | Unique `user_id` with `last_opened_at` within 30 days |
| **Books opened (7d)** | Books with `last_opened_at` within 7 days |
| **Avg annotations/book** | `(notes + highlights) / books` |

---

## Per-book metrics (user-facing)

On book details page:

- **Last opened** — formatted relative time (`formatLastOpened`)
- **Read count** — increments when `progress_percent` reaches 100%
- **Progress %** — on shelf cards (hover)

---

## Exporting analytics for due diligence

### Option 1: Admin dashboard screenshots

1. Log in as admin (`ADMIN_EMAILS`)
2. Open `/admin`
3. Screenshot platform + engagement cards
4. Include in Data Room or buyer deck

### Option 2: Supabase SQL

```sql
-- User count
SELECT COUNT(*) FROM profiles;

-- Books per user
SELECT user_id, COUNT(*) AS books
FROM books GROUP BY user_id ORDER BY books DESC;

-- Completion funnel
SELECT
  COUNT(*) FILTER (WHERE progress_percent = 0) AS not_started,
  COUNT(*) FILTER (WHERE progress_percent BETWEEN 1 AND 49) AS in_progress,
  COUNT(*) FILTER (WHERE progress_percent BETWEEN 50 AND 99) AS advanced,
  COUNT(*) FILTER (WHERE progress_percent = 100) AS completed
FROM books;

-- Active last 30 days
SELECT COUNT(DISTINCT user_id)
FROM books
WHERE last_opened_at > NOW() - INTERVAL '30 days';
```

### Option 3: Add third-party analytics (buyer enhancement)

Not included by default. Recommended for marketing pages only:

- [Vercel Analytics](https://vercel.com/analytics) — page views
- [Plausible](https://plausible.io) — privacy-friendly traffic
- PostHog — product funnels

Install as buyer post-acquisition task; document in handover.

---

## What is NOT tracked today

| Gap | Recommendation |
|-----|----------------|
| Page views / traffic | Add Plausible on landing + `/platform` |
| Reader session duration | Add event on reader mount/unmount |
| Export downloads | Log in export API route |
| Funnel (signup → upload → read) | PostHog or custom events table |

---

## Demo data disclaimer

`npm run seed:demo` creates sample books for walkthroughs. Exclude demo user (`demo@readshelf.app`) from buyer-facing metrics:

```sql
SELECT COUNT(*) FROM books b
JOIN auth.users u ON u.id = b.user_id
WHERE u.email != 'demo@readshelf.app';
```
