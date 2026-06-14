-- Recreate storage buckets if missing (safe to re-run).

insert into storage.buckets (id, name, public)
values
  ('book-pdfs', 'book-pdfs', false),
  ('book-covers', 'book-covers', false)
on conflict (id) do nothing;
