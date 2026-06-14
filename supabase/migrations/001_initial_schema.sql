-- ReadShelf initial schema
-- Run this in Supabase SQL Editor after creating your project.

-- Books
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text not null default '',
  category text,
  pdf_path text not null,
  cover_path text,
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  last_page integer not null default 1 check (last_page >= 1),
  total_pages integer check (total_pages is null or total_pages >= 1),
  last_opened_at timestamptz,
  created_at timestamptz not null default now()
);

-- Highlights
create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  selected_text text not null,
  color text not null default 'yellow',
  position jsonb,
  created_at timestamptz not null default now()
);

-- Notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  note_text text not null,
  highlight_id uuid references public.highlights(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_user_id_idx on public.books(user_id);
create index if not exists books_last_opened_at_idx on public.books(last_opened_at desc);
create index if not exists highlights_book_id_idx on public.highlights(book_id);
create index if not exists highlights_user_id_idx on public.highlights(user_id);
create index if not exists notes_book_id_idx on public.notes(book_id);
create index if not exists notes_user_id_idx on public.notes(user_id);

alter table public.books enable row level security;
alter table public.highlights enable row level security;
alter table public.notes enable row level security;

create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can insert own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

create policy "Users can view own highlights"
  on public.highlights for select
  using (auth.uid() = user_id);

create policy "Users can insert own highlights"
  on public.highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can update own highlights"
  on public.highlights for update
  using (auth.uid() = user_id);

create policy "Users can delete own highlights"
  on public.highlights for delete
  using (auth.uid() = user_id);

create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Storage buckets (create in Dashboard if insert fails)
insert into storage.buckets (id, name, public)
values
  ('book-pdfs', 'book-pdfs', false),
  ('book-covers', 'book-covers', false)
on conflict (id) do nothing;

create policy "Users can read own PDFs"
  on storage.objects for select
  using (
    bucket_id = 'book-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload own PDFs"
  on storage.objects for insert
  with check (
    bucket_id = 'book-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own PDFs"
  on storage.objects for update
  using (
    bucket_id = 'book-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own PDFs"
  on storage.objects for delete
  using (
    bucket_id = 'book-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own covers"
  on storage.objects for select
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload own covers"
  on storage.objects for insert
  with check (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own covers"
  on storage.objects for update
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own covers"
  on storage.objects for delete
  using (
    bucket_id = 'book-covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
