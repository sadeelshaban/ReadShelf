-- Reader UI preferences for cross-device sync and admin analytics.
alter table public.profiles
  add column if not exists reader_dark_mode boolean not null default false,
  add column if not exists reader_preferences_updated_at timestamptz;
