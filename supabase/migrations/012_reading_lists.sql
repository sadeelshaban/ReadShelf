-- Reading lists: named collections of shelf books

create table if not exists public.reading_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_lists_name_not_blank check (char_length(trim(name)) > 0)
);

create table if not exists public.reading_list_books (
  list_id uuid not null references public.reading_lists(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (list_id, book_id)
);

create index if not exists reading_lists_user_id_idx on public.reading_lists(user_id);
create index if not exists reading_lists_updated_at_idx on public.reading_lists(user_id, updated_at desc);
create index if not exists reading_list_books_book_id_idx on public.reading_list_books(book_id);
create index if not exists reading_list_books_list_id_idx on public.reading_list_books(list_id);

alter table public.reading_lists enable row level security;
alter table public.reading_list_books enable row level security;

create policy "Users can view own reading lists"
  on public.reading_lists for select
  using (auth.uid() = user_id);

create policy "Users can insert own reading lists"
  on public.reading_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reading lists"
  on public.reading_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete own reading lists"
  on public.reading_lists for delete
  using (auth.uid() = user_id);

create policy "Users can view own reading list books"
  on public.reading_list_books for select
  using (
    exists (
      select 1 from public.reading_lists
      where reading_lists.id = reading_list_books.list_id
        and reading_lists.user_id = auth.uid()
    )
  );

create policy "Users can insert own reading list books"
  on public.reading_list_books for insert
  with check (
    exists (
      select 1 from public.reading_lists
      where reading_lists.id = reading_list_books.list_id
        and reading_lists.user_id = auth.uid()
    )
    and exists (
      select 1 from public.books
      where books.id = reading_list_books.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can delete own reading list books"
  on public.reading_list_books for delete
  using (
    exists (
      select 1 from public.reading_lists
      where reading_lists.id = reading_list_books.list_id
        and reading_lists.user_id = auth.uid()
    )
  );
