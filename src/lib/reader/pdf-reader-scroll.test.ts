import { describe, expect, it } from "vitest";
import {
  mergeRenderedPages,
  noteFocusAnchorRatio,
  resolveVisiblePage,
  scrollViewerToPage,
  scrollViewerToPageAnchor,
} from "@/lib/reader/pdf-reader-scroll";

describe("mergeRenderedPages", () => {
  it("adds pages within buffer around center", () => {
    const prev = new Set([1]);
    const next = mergeRenderedPages(prev, 5, 10, 2);
    expect(next).toEqual(new Set([1, 3, 4, 5, 6, 7]));
  });

  it("returns same set when no new pages needed", () => {
    const prev = new Set([3, 4, 5, 6, 7]);
    const next = mergeRenderedPages(prev, 5, 10, 2);
    expect(next).toBe(prev);
  });

  it("clamps to document bounds", () => {
    const prev = new Set<number>();
    const next = mergeRenderedPages(prev, 1, 3, 2);
    expect(next).toEqual(new Set([1, 2, 3]));
  });
});

describe("resolveVisiblePage", () => {
  function mockRect(top: number, height: number) {
    return {
      top,
      bottom: top + height,
      left: 0,
      right: 400,
      width: 400,
      height,
    } as DOMRect;
  }

  it("picks page whose center contains viewer center", () => {
    const viewer = {
      getBoundingClientRect: () => mockRect(0, 600),
    } as HTMLDivElement;

    const pageWraps = new Map<number, HTMLElement>([
      [1, { getBoundingClientRect: () => mockRect(0, 500) } as HTMLElement],
      [2, { getBoundingClientRect: () => mockRect(500, 500) } as HTMLElement],
    ]);

    expect(resolveVisiblePage(viewer, pageWraps, 2)).toBe(1);
  });

  it("prefers page containing viewer center when overlapping", () => {
    const viewer = {
      getBoundingClientRect: () => mockRect(400, 200),
    } as HTMLDivElement;

    const pageWraps = new Map<number, HTMLElement>([
      [1, { getBoundingClientRect: () => mockRect(0, 450) } as HTMLElement],
      [2, { getBoundingClientRect: () => mockRect(450, 450) } as HTMLElement],
    ]);

    expect(resolveVisiblePage(viewer, pageWraps, 2)).toBe(2);
  });
});

describe("scrollViewerToPage", () => {
  it("scrolls viewer so page top aligns near viewport top", () => {
    let scrolledTo: ScrollToOptions | undefined;
    const viewer = {
      scrollTop: 100,
      getBoundingClientRect: () => ({ top: 50 } as DOMRect),
      scrollTo: (options: ScrollToOptions) => {
        scrolledTo = options;
      },
    } as unknown as HTMLDivElement;

    const pageWrap = {
      getBoundingClientRect: () => ({ top: 200 } as DOMRect),
    } as HTMLElement;

    scrollViewerToPage(viewer, pageWrap, "auto");
    expect(scrolledTo).toEqual({ top: 242, behavior: "auto" });
  });
});

describe("noteFocusAnchorRatio", () => {
  it("maps note vertical position to upper, center, or lower page anchor", () => {
    const base = { height: 40, viewportHeight: 800 };
    expect(noteFocusAnchorRatio({ ...base, y: 50 })).toBe(0.25);
    expect(noteFocusAnchorRatio({ ...base, y: 360 })).toBe(0.5);
    expect(noteFocusAnchorRatio({ ...base, y: 700 })).toBe(0.75);
  });
});

describe("scrollViewerToPageAnchor", () => {
  it("centers the chosen anchor in the viewport", () => {
    let scrolledTo: ScrollToOptions | undefined;
    const viewer = {
      scrollTop: 0,
      clientHeight: 400,
      getBoundingClientRect: () => ({ top: 0, height: 400 } as DOMRect),
      scrollTo: (options: ScrollToOptions) => {
        scrolledTo = options;
      },
    } as unknown as HTMLDivElement;

    const pageWrap = {
      getBoundingClientRect: () => ({ top: 100, height: 800 } as DOMRect),
    } as HTMLElement;

    scrollViewerToPageAnchor(viewer, pageWrap, 0.25, "auto");
    expect(scrolledTo).toEqual({ top: 100, behavior: "auto" });
  });
});
