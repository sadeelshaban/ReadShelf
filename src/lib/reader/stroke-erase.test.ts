import { describe, expect, it } from "vitest";
import {
  computeEraserChanges,
  densifyPath,
  effectiveStrokeWidth,
  eraseStrokeByPath,
  eraserBrushRadius,
} from "@/lib/reader/stroke-erase";
import type { Highlight } from "@/types";

describe("effectiveStrokeWidth", () => {
  it("returns 1 for non-positive widths", () => {
    expect(effectiveStrokeWidth(0)).toBe(1);
    expect(effectiveStrokeWidth(-4)).toBe(1);
  });

  it("returns width when positive", () => {
    expect(effectiveStrokeWidth(8)).toBe(8);
  });
});

describe("eraserBrushRadius", () => {
  it("is half the effective stroke width", () => {
    expect(eraserBrushRadius(10)).toBe(5);
    expect(eraserBrushRadius(0)).toBe(0.5);
  });
});

describe("densifyPath", () => {
  it("returns empty array for empty input", () => {
    expect(densifyPath([])).toEqual([]);
  });

  it("returns single point unchanged", () => {
    expect(densifyPath([{ x: 1, y: 2 }])).toEqual([{ x: 1, y: 2 }]);
  });

  it("inserts intermediate points along long segments", () => {
    const result = densifyPath(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ],
      5,
    );
    expect(result.length).toBeGreaterThan(2);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[result.length - 1]).toEqual({ x: 10, y: 0 });
  });
});

describe("eraseStrokeByPath", () => {
  it("splits a stroke where the eraser crosses", () => {
    const stroke = {
      width: 4,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    };
    const remaining = eraseStrokeByPath(stroke, [{ x: 50, y: 0 }], 20);
    expect(remaining.length).toBe(2);
    expect(remaining[0].points[0]).toEqual({ x: 0, y: 0 });
    expect(remaining[1].points[remaining[1].points.length - 1]).toEqual({
      x: 100,
      y: 0,
    });
  });
});

describe("computeEraserChanges", () => {
  function makeHighlight(overrides?: Partial<Highlight>): Highlight {
    return {
      id: "h1",
      book_id: "b1",
      user_id: "u1",
      page_number: 1,
      selected_text: "",
      color: "#000",
      highlight_type: "pen",
      position: {
        strokes: [
          {
            width: 4,
            points: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
            ],
          },
        ],
        viewportWidth: 200,
        viewportHeight: 200,
      },
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  it("erases using current canvas size after zoom (scaled hit-test)", () => {
    const highlight = makeHighlight();
    // Stroke saved at 200×200; current canvas is 2× (400×400).
    // Midpoint of the stroke is at canvas (200, 0).
    const changes = computeEraserChanges(
      [highlight],
      1,
      [{ x: 200, y: 0 }],
      24,
      400,
      400,
    );
    expect(changes).toHaveLength(1);
    expect(changes[0].after).not.toBeNull();
    expect(changes[0].after?.position?.strokes?.length).toBeGreaterThan(0);
  });

  it("larger eraser width removes more of the stroke", () => {
    const highlight = makeHighlight();
    const thin = computeEraserChanges([highlight], 1, [{ x: 50, y: 0 }], 8, 200, 200);
    const thick = computeEraserChanges([highlight], 1, [{ x: 50, y: 0 }], 40, 200, 200);

    const thinPts =
      thin[0]?.after?.position?.strokes?.reduce(
        (sum, s) => sum + s.points.length,
        0,
      ) ?? 0;
    const thickPts =
      thick[0]?.after?.position?.strokes?.reduce(
        (sum, s) => sum + s.points.length,
        0,
      ) ?? 0;

    expect(thickPts).toBeLessThan(thinPts);
  });
});
