type CoverEntry = {
  url: string;
  expiresAt: number;
};

const MEMORY = new Map<string, CoverEntry>();
const STORAGE_KEY = "readshelf:cover-urls";
const TTL_MS = 55 * 60 * 1000;

let storageLoaded = false;

function loadFromSessionStorage() {
  if (storageLoaded || typeof sessionStorage === "undefined") {
    storageLoaded = true;
    return;
  }

  storageLoaded = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<string, CoverEntry>;
    const now = Date.now();

    for (const [path, entry] of Object.entries(parsed)) {
      if (entry.url && entry.expiresAt > now) {
        MEMORY.set(path, entry);
      }
    }
  } catch {
    // Ignore corrupt cache payloads.
  }
}

function persistToSessionStorage() {
  if (typeof sessionStorage === "undefined") return;

  try {
    const payload: Record<string, CoverEntry> = {};
    for (const [path, entry] of MEMORY.entries()) {
      if (entry.expiresAt > Date.now()) {
        payload[path] = entry;
      }
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota or privacy-mode failures.
  }
}

export function getCachedCoverUrl(path: string | null | undefined) {
  loadFromSessionStorage();
  if (!path) return null;

  const entry = MEMORY.get(path);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    MEMORY.delete(path);
    persistToSessionStorage();
    return null;
  }

  return entry.url;
}

export function rememberCoverUrl(path: string | null | undefined, url: string | null) {
  loadFromSessionStorage();
  if (!path || !url) return;

  MEMORY.set(path, {
    url,
    expiresAt: Date.now() + TTL_MS,
  });
  persistToSessionStorage();
}

export function buildCoverUrlMap(books: Array<{ id: string; cover_path: string | null }>) {
  loadFromSessionStorage();

  const map: Record<string, string | null> = {};
  for (const book of books) {
    map[book.id] = getCachedCoverUrl(book.cover_path);
  }
  return map;
}
