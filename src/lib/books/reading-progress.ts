export function normalizePagesVisited(
  pages: number[] | null | undefined,
  totalPages: number | null,
) {
  const maxPage = totalPages && totalPages > 0 ? totalPages : Number.POSITIVE_INFINITY;
  const seen = new Set<number>();
  for (const page of pages ?? []) {
    if (!Number.isFinite(page)) continue;
    const rounded = Math.round(page);
    if (rounded >= 1 && rounded <= maxPage) {
      seen.add(rounded);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

export function mergeVisitedPages(
  existing: number[] | null | undefined,
  nextPages: Iterable<number>,
  totalPages: number | null,
) {
  const seen = new Set(normalizePagesVisited(existing, totalPages));
  let changed = false;

  for (const page of nextPages) {
    if (!Number.isFinite(page)) continue;
    const rounded = Math.round(page);
    if (rounded < 1) continue;
    if (totalPages != null && totalPages > 0 && rounded > totalPages) continue;
    if (!seen.has(rounded)) {
      seen.add(rounded);
      changed = true;
    }
  }

  if (!changed) {
    return normalizePagesVisited(existing, totalPages);
  }

  return [...seen].sort((a, b) => a - b);
}

export function computeProgressFromVisitedPages(
  pagesVisited: number[] | null | undefined,
  totalPages: number | null,
) {
  if (!totalPages || totalPages <= 0) return 0;
  const unique = normalizePagesVisited(pagesVisited, totalPages);
  return Math.min(100, Math.round((unique.length / totalPages) * 100));
}

export function isBookFullyRead(
  pagesVisited: number[] | null | undefined,
  totalPages: number | null,
) {
  if (!totalPages || totalPages <= 0) return false;
  return normalizePagesVisited(pagesVisited, totalPages).length >= totalPages;
}

/** Preserve existing shelf progress when pages_visited has not been tracked yet. */
export function inferInitialPagesVisited(
  pagesVisited: number[] | null | undefined,
  lastPage: number,
  progressPercent: number,
  totalPages: number | null,
) {
  const normalized = normalizePagesVisited(pagesVisited, totalPages);
  if (normalized.length > 0) {
    return normalized;
  }

  if (lastPage <= 0) return [];

  const maxPage = totalPages && totalPages > 0 ? totalPages : lastPage;
  const clampedLast = Math.min(Math.max(1, lastPage), maxPage);

  // Legacy progress assumed sequential reading through last_page.
  if (progressPercent > 0) {
    return Array.from({ length: clampedLast }, (_, index) => index + 1);
  }

  return [clampedLast];
}
