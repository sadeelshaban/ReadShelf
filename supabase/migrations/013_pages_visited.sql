alter table public.books
  add column if not exists pages_visited integer[] not null default '{}';

-- Backfill from last_page so existing progress is preserved for sequential readers.
update public.books
set pages_visited = (
  select coalesce(array_agg(page order by page), '{}'::integer[])
  from generate_series(1, least(last_page, coalesce(total_pages, last_page))) as page
)
where coalesce(array_length(pages_visited, 1), 0) = 0
  and last_page >= 1;
