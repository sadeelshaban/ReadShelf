import { PAGE_RENDER_BUFFER } from "@/lib/reader/pdf-reader-config";

export function mergeRenderedPages(
  prev: Set<number>,
  center: number,
  maxPage: number,
  buffer = PAGE_RENDER_BUFFER,
) {
  const next = new Set(prev);
  let changed = false;
  const start = Math.max(1, center - buffer);
  const end = Math.min(maxPage, center + buffer);
  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    if (!next.has(pageNumber)) {
      next.add(pageNumber);
      changed = true;
    }
  }
  return changed ? next : prev;
}

export function scrollViewerToPage(
  viewer: HTMLDivElement,
  pageWrap: HTMLElement,
  behavior: ScrollBehavior = "smooth",
) {
  const viewerRect = viewer.getBoundingClientRect();
  const pageRect = pageWrap.getBoundingClientRect();
  const nextTop = viewer.scrollTop + (pageRect.top - viewerRect.top) - 8;
  viewer.scrollTo({ top: Math.max(0, nextTop), behavior });
}

export function resolveVisiblePage(
  viewer: HTMLDivElement,
  pageWraps: Map<number, HTMLElement>,
  maxPage: number,
) {
  const viewerRect = viewer.getBoundingClientRect();
  const centerY = viewerRect.top + viewerRect.height / 2;

  let bestPage = 1;
  let bestScore = -Infinity;

  for (let pageNumber = 1; pageNumber <= maxPage; pageNumber += 1) {
    const wrap = pageWraps.get(pageNumber);
    if (!wrap) continue;

    const rect = wrap.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, viewerRect.top);
    const visibleBottom = Math.min(rect.bottom, viewerRect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    if (visibleHeight <= 0) continue;

    const centerInPage = centerY >= rect.top && centerY <= rect.bottom;
    const score = (centerInPage ? 1_000_000 : 0) + visibleHeight;

    if (score > bestScore) {
      bestScore = score;
      bestPage = pageNumber;
    }
  }

  return bestPage;
}

/** Pages with any pixels visible in the viewer (used for read-progress tracking). */
export function collectVisiblePages(
  viewer: HTMLDivElement,
  pageWraps: Map<number, HTMLElement>,
  maxPage: number,
) {
  const viewerRect = viewer.getBoundingClientRect();
  const visible: number[] = [];

  for (let pageNumber = 1; pageNumber <= maxPage; pageNumber += 1) {
    const wrap = pageWraps.get(pageNumber);
    if (!wrap) continue;

    const rect = wrap.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, viewerRect.top);
    const visibleBottom = Math.min(rect.bottom, viewerRect.bottom);
    if (visibleBottom > visibleTop) {
      visible.push(pageNumber);
    }
  }

  return visible;
}
