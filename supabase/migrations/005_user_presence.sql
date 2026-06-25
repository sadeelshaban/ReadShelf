-- Live presence: updated while the user has the site open.
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
