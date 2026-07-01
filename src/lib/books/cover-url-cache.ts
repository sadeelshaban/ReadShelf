const coverUrlByPath = new Map<string, string>();

export function getCachedCoverUrl(path: string | null | undefined) {
  if (!path) return null;
  return coverUrlByPath.get(path) ?? null;
}

export function rememberCoverUrl(path: string | null | undefined, url: string | null) {
  if (!path || !url) return;
  coverUrlByPath.set(path, url);
}

export function buildCoverUrlMap(books: Array<{ id: string; cover_path: string | null }>) {
  const map: Record<string, string | null> = {};
  for (const book of books) {
    map[book.id] = getCachedCoverUrl(book.cover_path);
  }
  return map;
}
