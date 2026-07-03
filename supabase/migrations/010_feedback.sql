-- User feedback (admin-visible email; anonymous to other users)

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text not null,
  category text not null check (category in ('design', 'bugs', 'feature', 'general')),
  message text not null check (
    char_length(trim(message)) >= 3
    and char_length(message) <= 5000
  ),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_user_id_idx on public.feedback (user_id);

alter table public.feedback enable row level security;

create policy "Users can submit feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);
