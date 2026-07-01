# Analytics

ReadShelf includes **built-in engagement analytics** in the admin dashboard (`/admin`). No third-party tracker is required — all metrics come from Supabase.

Source: `src/lib/admin/stats.ts`

## Platform stats

| Metric | Source |
|--------|--------|
| Total users | `profiles` count |
| Total books | `books` count |
| Total notes | `notes` count |
| Total highlights | `highlights` count |

## Engagement stats

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

### Option 3: Third-party analytics (optional, buyer post-acquisition)

Not included by default. Buyers may add Vercel Analytics, PostHog, or similar if they need marketing-page traffic — document in handover.

---

## What is NOT tracked today

| Gap | Recommendation |
|-----|----------------|
| Marketing page traffic | Optional: Vercel Analytics or PostHog post-acquisition |
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
