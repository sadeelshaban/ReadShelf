-- Normalize every comment annotation to the default 14px font size.
update public.notes
set position = (position - 'commentFontScreen') || jsonb_build_object('fontSize', 14)
where position is not null
  and position->>'kind' = 'comment';
