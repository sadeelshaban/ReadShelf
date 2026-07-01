alter table public.books
  add column if not exists read_count integer not null default 0 check (read_count >= 0);

update public.books
set read_count = 1
where progress_percent >= 100
  and read_count = 0;
