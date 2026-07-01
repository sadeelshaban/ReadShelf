-- Auto-saved reading position (separate from manual bookmarks)
alter table public.books
  add column if not exists reading_scroll_y double precision,
  add column if not exists reading_zoom double precision;

-- Manual bookmarks with label, note, and color
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  scroll_y double precision not null default 0,
  label text not null default '',
  note_text text not null default '',
  color text not null default 'gold',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookmarks_book_id_idx on public.bookmarks(book_id);
create index if not exists bookmarks_user_id_idx on public.bookmarks(user_id);
create index if not exists bookmarks_page_idx on public.bookmarks(book_id, page_number);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);
