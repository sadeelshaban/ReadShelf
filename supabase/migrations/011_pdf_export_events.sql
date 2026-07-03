-- Track annotated PDF exports for admin analytics.

create table if not exists public.pdf_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists pdf_exports_created_at_idx on public.pdf_exports (created_at desc);
create index if not exists pdf_exports_user_id_idx on public.pdf_exports (user_id);

alter table public.pdf_exports enable row level security;
