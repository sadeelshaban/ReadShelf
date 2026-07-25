import { describe, expect, it, vi } from "vitest";
import { applyZoomAnchor, type ZoomAnchor } from "@/lib/reader/pdf-reader-zoom";

describe("applyZoomAnchor", () => {
  it("scrolls so the anchored page point stays under the cursor", () => {
    const viewer = {
      scrollLeft: 40,
      scrollTop: 120,
    } as HTMLElement;

    const wrap = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 200,
        width: 200,
        height: 400,
        right: 300,
        bottom: 600,
        x: 100,
        y: 200,
        toJSON: () => ({}),
      }),
    } as HTMLElement;

    const pageWraps = new Map<number, HTMLElement>([[3, wrap]]);
    const anchor: ZoomAnchor = {
      clientX: 150,
      clientY: 300,
      pageNumber: 3,
      relX: 0.25,
      relY: 0.25,
    };

    // Point on page at rel 0.25/0.25 is currently at (150, 300) — already under cursor.
    applyZoomAnchor(viewer, pageWraps, anchor);
    expect(viewer.scrollLeft).toBe(40);
    expect(viewer.scrollTop).toBe(120);

    // After zoom, page grows and point moves on screen to (180, 360).
    wrap.getBoundingClientRect = () =>
      ({
        left: 80,
        top: 160,
        width: 400,
        height: 800,
        right: 480,
        bottom: 960,
        x: 80,
        y: 160,
        toJSON: () => ({}),
      }) as DOMRect;

    applyZoomAnchor(viewer, pageWraps, anchor);
    // point = (80+100, 160+200) = (180, 360); delta = (30, 60)
    expect(viewer.scrollLeft).toBe(70);
    expect(viewer.scrollTop).toBe(180);
  });

  it("no-ops when the anchored page wrap is missing", () => {
    const viewer = { scrollLeft: 10, scrollTop: 20 } as HTMLElement;
    const spy = vi.fn();
    applyZoomAnchor(viewer, new Map(), {
      clientX: 1,
      clientY: 2,
      pageNumber: 9,
      relX: 0.5,
      relY: 0.5,
    });
    expect(viewer.scrollLeft).toBe(10);
    expect(viewer.scrollTop).toBe(20);
    expect(spy).not.toHaveBeenCalled();
  });
});
