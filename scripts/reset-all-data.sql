-- Wipe all ReadShelf user content (books, highlights, notes).
-- Storage files are removed separately via the Storage API (see reset-data.ps1).

truncate table public.notes restart identity cascade;
truncate table public.highlights restart identity cascade;
truncate table public.books restart identity cascade;
