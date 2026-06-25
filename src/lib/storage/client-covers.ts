export async function getClientCoverReadUrl(path: string | null) {
  if (!path) return null;

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
