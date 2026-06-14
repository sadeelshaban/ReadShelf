-- Note positions on PDF pages + freeform highlights + realtime sync

alter table public.notes
  add column if not exists position jsonb;

alter table public.highlights
  alter column selected_text set default '';

alter table public.highlights
  add column if not exists highlight_type text not null default 'freeform';

do $$
begin
  alter publication supabase_realtime add table public.highlights;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception
  when duplicate_object then null;
end $$;
