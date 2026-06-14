export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key) return false;
  if (url.includes("your-project")) return false;
  if (key.includes("your-anon-key")) return false;

  return true;
}
