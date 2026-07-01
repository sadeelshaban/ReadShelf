import { describe, expect, it } from "vitest";
import {
  densifyPath,
  effectiveStrokeWidth,
  eraserBrushRadius,
} from "@/lib/reader/stroke-erase";

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
