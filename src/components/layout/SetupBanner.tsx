import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="mx-auto max-w-6xl">
        <strong>Supabase not configured.</strong> Create{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code> with your
        project URL and anon key, then run the SQL in{" "}
        <code className="rounded bg-amber-100 px-1">
          supabase/migrations/001_initial_schema.sql
        </code>
        . See the{" "}
        <Link href="/setup" className="font-medium underline">
          setup guide
        </Link>
        , or run <code className="rounded bg-amber-100 px-1">npm run setup:supabase</code>
        .
      </p>
    </div>
  );
}
