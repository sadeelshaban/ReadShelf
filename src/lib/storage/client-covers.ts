import { createClient } from "@/lib/supabase/client";

export async function getClientCoverReadUrl(path: string | null) {
  if (!path) return null;

  const publicBase = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_PUBLIC_BASE_URL?.replace(
    /\/$/,
    "",
  );
  if (publicBase) {
    return `${publicBase}/covers/${path}`;
  }

  let response: Response;
  try {
    response = await fetch(
      `/api/books/cover-url?path=${encodeURIComponent(path)}`,
    );
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const body = (await response.json()) as { url?: string };
  return body.url ?? null;
}
