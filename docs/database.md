# Database Reference

PostgreSQL on Supabase. All user tables use **Row Level Security (RLS)**.

## Migrations (apply in order)

| File | Contents |
|------|----------|
| `001_initial_schema.sql` | `books`, `highlights`, `notes`, storage buckets, RLS |
| `002_note_positions_and_realtime.sql` | Note `position` JSONB, highlight `position`, realtime |
| `003_note_text_color.sql` | `notes.text_color` |
| `004_profiles.sql` | `profiles` table, signup trigger |
| `005_user_presence.sql` | `profiles.last_seen_at`, update policy |
| `006_reading_position_and_bookmarks.sql` | `reading_scroll_y`, `reading_zoom`, `bookmarks` table |
| `007_book_read_count.sql` | `books.read_count`, backfill for completed books |

Apply via Supabase SQL editor or:

```bash
npx supabase db push
```

---

## Table: `books`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | Book identifier |
| `user_id` | uuid FK → auth.users | Owner |
| `title` | text | Display title |
| `author` | text | Author name |
| `category` | text | Optional category |
| `pdf_path` | text | Storage path |
| `cover_path` | text | Cover image path |
| `progress_percent` | int 0–100 | Reading progress |
| `last_page` | int | Last read page |
| `total_pages` | int | From PDF metadata |
| `read_count` | int | Times completed (100%) |
| `reading_scroll_y` | float | Viewer scroll for resume |
| `reading_zoom` | float | Zoom multiplier for resume |
| `last_opened_at` | timestamptz | Last reader session |
| `created_at` | timestamptz | Upload time |

**RLS:** Users CRUD only their own rows (`user_id = auth.uid()`).

---

## Table: `highlights`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `book_id` | uuid FK | Parent book |
| `user_id` | uuid FK | Owner |
| `page_number` | int | 1-based page |
| `selected_text` | text | Selected text (if any) |
| `color` | text | Hex or preset name |
| `highlight_type` | text | `highlight` or `pen` |
| `position` | jsonb | Strokes/rects + viewport size |
| `created_at` | timestamptz | |

---

## Table: `notes`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `book_id` | uuid FK | |
| `user_id` | uuid FK | |
| `highlight_id` | uuid FK nullable | Linked highlight |
| `page_number` | int | |
| `note_text` | text | Content |
| `text_color` | text | black, red, blue, etc. |
| `position` | jsonb | x, y, width, height, fontSize |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Table: `bookmarks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `book_id` | uuid FK | |
| `user_id` | uuid FK | |
| `page_number` | int | |
| `scroll_y` | float | Legacy; navigation uses page only |
| `label` | text | Optional one-word label |
| `note_text` | text | Unused in UI (reserved) |
| `color` | text | yellow, blue, red |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

## Table: `profiles`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK FK → auth.users | |
| `is_admin` | boolean | Set by `create:admin` script |
| `last_seen_at` | timestamptz | Presence heartbeat |
| `created_at` | timestamptz | |

**RLS:** Users read/update own profile only.

---

## RLS policy summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| books | own | own | own | own |
| highlights | own | own | own | own |
| notes | own | own | own | own |
| bookmarks | own | own | own | own |
| profiles | own | trigger | own | — |

Storage policies restrict bucket access to owning `user_id` path prefix.

---

## Indexes

- `books(user_id)`, `books(last_opened_at desc)`
- `highlights(book_id)`, `highlights(user_id)`
- `notes(book_id)`, `notes(user_id)`
- `bookmarks(book_id)`, `bookmarks(user_id)`, `bookmarks(book_id, page_number)`

---

## Realtime

Publications enabled for `highlights` and `notes` (migration 002) for future multi-device sync extensions.
