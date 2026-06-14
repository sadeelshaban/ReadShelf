-- Note text color for reader annotations

alter table public.notes
  add column if not exists text_color text not null default 'black';
