import type { Highlight, HighlightStroke } from "@/types";
import { scaleStroke } from "@/lib/reader/coordinates";
import { scaleShape, shapeHitByEraser, shapeKindFromHighlight } from "@/lib/reader/shapes";

type Point = { x: number; y: number };

export type EraserHighlightChange = {
  before: Highlight;
  after: Highlight | null;
};

function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function effectiveStrokeWidth(width: number) {
  return width <= 0 ? 1 : width;
}

export function eraserBrushRadius(eraserWidth: number) {
  return effectiveStrokeWidth(eraserWidth) / 2;
}

export function densifyPath(points: Point[], maxStep = 3): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0]];

  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(dist / maxStep));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      result.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      });
    }
  }
  return result;
}

function minDistanceToEraserPath(point: Point, eraserPath: Point[]): number {
  let min = Infinity;
  for (const sample of eraserPath) {
    min = Math.min(min, Math.hypot(point.x - sample.x, point.y - sample.y));
  }
  for (let i = 1; i < eraserPath.length; i += 1) {
    const p1 = eraserPath[i - 1];
    const p2 = eraserPath[i];
    min = Math.min(
      min,
      distanceToSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y),
    );
  }
  return min;
}

function sampleStrokePoints(stroke: HighlightStroke, step = 2): Point[] {
  if (stroke.points.length === 0) return [];
  if (stroke.points.length === 1) return [stroke.points[0]];

  const samples: Point[] = [];
  for (let i = 1; i < stroke.points.length; i += 1) {
    const p1 = stroke.points[i - 1];
    const p2 = stroke.points[i];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(dist / step));
    for (let j = 0; j < steps; j += 1) {
      const t = j / steps;
      samples.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
      });
    }
  }
  const end = stroke.points[stroke.points.length - 1];
  const tail = samples[samples.length - 1];
  if (!tail || tail.x !== end.x || tail.y !== end.y) {
    samples.push(end);
  }
  return samples;
}

function strokesEqual(a: HighlightStroke[], b: HighlightStroke[]) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function eraseStrokeByPath(
  stroke: HighlightStroke,
  eraserPoints: Point[],
  eraserWidth: number,
): HighlightStroke[] {
  const radius = eraserBrushRadius(eraserWidth);
  const eraser = densifyPath(eraserPoints, Math.min(3, Math.max(0.5, radius / 2)));
  if (eraser.length === 0) {
    return stroke.points.length >= 2 ? [stroke] : [];
  }

  const samples = sampleStrokePoints(stroke, 2);
  const segments: HighlightStroke[] = [];
  let current: Point[] = [];

  for (const sample of samples) {
    const erased = minDistanceToEraserPath(sample, eraser) <= radius;
    if (erased) {
      if (current.length >= 2) {
        segments.push({ points: current, width: stroke.width });
      }
      current = [];
      continue;
    }

    const last = current[current.length - 1];
    if (!last || Math.hypot(sample.x - last.x, sample.y - last.y) >= 0.5) {
      current.push(sample);
    }
  }

  if (current.length >= 2) {
    segments.push({ points: current, width: stroke.width });
  }

  return segments;
}

/**
 * Erase in the current canvas coordinate space.
 * Strokes/shapes are scaled from their saved viewport → current canvas,
 * erased, then scaled back so thickness changes only affect brush size.
 */
export function computeEraserChanges(
  highlights: Highlight[],
  pageNumber: number,
  eraserPoints: Point[],
  eraserWidth: number,
  canvasWidth: number,
  canvasHeight: number,
): EraserHighlightChange[] {
  if (eraserPoints.length === 0) return [];
  if (canvasWidth <= 0 || canvasHeight <= 0) return [];

  const changes: EraserHighlightChange[] = [];
  const pageHighlights = highlights.filter(
    (highlight) => highlight.page_number === pageNumber,
  );

  for (const highlight of pageHighlights) {
    const refW = highlight.position?.viewportWidth ?? canvasWidth;
    const refH = highlight.position?.viewportHeight ?? canvasHeight;
    const shapeKind = shapeKindFromHighlight(highlight);

    if (shapeKind && highlight.position?.shape) {
      const scaledShape = scaleShape(
        highlight.position.shape,
        refW,
        refH,
        canvasWidth,
        canvasHeight,
      );
      if (shapeHitByEraser(scaledShape, shapeKind, eraserPoints, eraserWidth)) {
        changes.push({ before: highlight, after: null });
      }
      continue;
    }

    const oldStrokes = highlight.position?.strokes ?? [];
    const scaledStrokes = oldStrokes.map((stroke) =>
      scaleStroke(stroke, refW, refH, canvasWidth, canvasHeight),
    );
    const erasedScaled = scaledStrokes.flatMap((stroke) =>
      eraseStrokeByPath(stroke, eraserPoints, eraserWidth),
    );

    // Scale remaining segments back into the highlight's saved viewport.
    const newStrokes = erasedScaled.map((stroke) =>
      scaleStroke(stroke, canvasWidth, canvasHeight, refW, refH),
    );

    if (strokesEqual(oldStrokes, newStrokes)) continue;

    if (newStrokes.length === 0) {
      changes.push({ before: highlight, after: null });
    } else {
      changes.push({
        before: highlight,
        after: {
          ...highlight,
          position: {
            ...highlight.position,
            strokes: newStrokes,
            viewportWidth: highlight.position?.viewportWidth ?? canvasWidth,
            viewportHeight: highlight.position?.viewportHeight ?? canvasHeight,
          },
        },
      });
    }
  }

  return changes;
}

export function applyEraserChanges(
  highlights: Highlight[],
  changes: EraserHighlightChange[],
): Highlight[] {
  let next = [...highlights];
  for (const change of changes) {
    if (change.after === null) {
      next = next.filter((entry) => entry.id !== change.before.id);
    } else {
      const index = next.findIndex((entry) => entry.id === change.before.id);
      if (index >= 0) next[index] = change.after;
    }
  }
  return next;
}
