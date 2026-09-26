/** Cursor/page-relative zoom anchoring (Chrome-style). */

export type ZoomAnchor = {
  clientX: number;
  clientY: number;
  pageNumber: number;
  /** Fraction across the page wrap width (may be outside 0–1 in gaps). */
  relX: number;
  /** Fraction down the page wrap height (may be outside 0–1 in gaps). */
  relY: number;
};

export function captureZoomAnchor(
  clientX: number,
  clientY: number,
  pageWraps: Map<number, HTMLElement>,
  fallbackPage: number,
): ZoomAnchor {
  let pageNumber = fallbackPage;
  let wrap = pageWraps.get(fallbackPage) ?? null;

  const hit = document
    .elementFromPoint(clientX, clientY)
    ?.closest("[data-page]");
  if (hit instanceof HTMLElement) {
    const parsed = Number.parseInt(hit.dataset.page ?? "", 10);
    if (Number.isFinite(parsed) && pageWraps.has(parsed)) {
      pageNumber = parsed;
      wrap = hit;
    }
  }

  if (!wrap) {
    let bestDist = Infinity;
    for (const [num, el] of pageWraps) {
      const rect = el.getBoundingClientRect();
      const cy = (rect.top + rect.bottom) / 2;
      const dist = Math.abs(cy - clientY);
      if (dist < bestDist) {
        bestDist = dist;
        pageNumber = num;
        wrap = el;
      }
    }
  }

  if (!wrap) {
    return { clientX, clientY, pageNumber: fallbackPage, relX: 0.5, relY: 0.5 };
  }

  const rect = wrap.getBoundingClientRect();
  return {
    clientX,
    clientY,
    pageNumber,
    relX: rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5,
    relY: rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5,
  };
}

/** Scroll so the anchored page point stays under the cursor (Chrome behavior). */
export function applyZoomAnchor(
  viewer: HTMLElement,
  pageWraps: Map<number, HTMLElement>,
  anchor: ZoomAnchor,
) {
  const wrap = pageWraps.get(anchor.pageNumber);
  if (!wrap) return;

  const rect = wrap.getBoundingClientRect();
  const pointX = rect.left + rect.width * anchor.relX;
  const pointY = rect.top + rect.height * anchor.relY;
  viewer.scrollLeft += pointX - anchor.clientX;
  viewer.scrollTop += pointY - anchor.clientY;
}
