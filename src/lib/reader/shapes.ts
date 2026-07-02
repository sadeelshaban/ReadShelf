import type { Highlight, HighlightShape } from "@/types";
import type { ShapeKind } from "@/types";
import { HIGHLIGHT_DRAW_ALPHA, hexToRgba } from "@/lib/reader/constants";
import { eraserBrushRadius } from "@/lib/reader/stroke-erase";

type Point = { x: number; y: number };

export function shapeHighlightType(kind: ShapeKind) {
  return `shape_${kind}` as const;
}

export function shapeKindFromHighlight(highlight: Highlight): ShapeKind | null {
  if (!highlight.highlight_type.startsWith("shape_")) return null;
  const kind = highlight.highlight_type.slice("shape_".length) as ShapeKind;
  if (kind === "rect" || kind === "ellipse" || kind === "line" || kind === "arrow") {
    return kind;
  }
  return null;
}

export function isShapeHighlight(highlight: Highlight) {
  return shapeKindFromHighlight(highlight) !== null;
}

export function scaleShape(
  shape: HighlightShape,
  refW: number,
  refH: number,
  curW: number,
  curH: number,
): HighlightShape {
  const sx = curW / refW;
  const sy = curH / refH;
  return {
    ...shape,
    x1: shape.x1 * sx,
    y1: shape.y1 * sy,
    x2: shape.x2 * sx,
    y2: shape.y2 * sy,
    strokeWidth: shape.strokeWidth * sx,
  };
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth: number,
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = Math.max(8, strokeWidth * 3);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 7),
    y2 - headLength * Math.sin(angle - Math.PI / 7),
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 7),
    y2 - headLength * Math.sin(angle + Math.PI / 7),
  );
  ctx.stroke();
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: HighlightShape,
  kind: ShapeKind,
  colorHex: string,
) {
  const { x1, y1, x2, y2, filled, strokeWidth } = shape;
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  ctx.save();
  ctx.strokeStyle = colorHex;
  ctx.fillStyle = hexToRgba(colorHex, HIGHLIGHT_DRAW_ALPHA);
  ctx.lineWidth = Math.max(1, strokeWidth);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "rect") {
    if (filled && width > 0 && height > 0) ctx.fillRect(left, top, width, height);
    if (width > 0 && height > 0) ctx.strokeRect(left, top, width, height);
  } else if (kind === "ellipse") {
    if (width > 0 && height > 0) {
      ctx.beginPath();
      ctx.ellipse(left + width / 2, top + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      if (filled) ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (kind === "arrow") {
      drawArrowHead(ctx, x1, y1, x2, y2, strokeWidth);
    }
  }

  ctx.restore();
}

function sampleSegment(p1: Point, p2: Point, step = 4): Point[] {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const steps = Math.max(1, Math.ceil(dist / step));
  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
    });
  }
  return points;
}

function shapeOutlineSamples(shape: HighlightShape, kind: ShapeKind): Point[] {
  const { x1, y1, x2, y2 } = shape;
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  if (kind === "line" || kind === "arrow") {
    return sampleSegment({ x: x1, y: y1 }, { x: x2, y: y2 });
  }

  if (kind === "rect") {
    const corners = [
      { x: left, y: top },
      { x: left + width, y: top },
      { x: left + width, y: top + height },
      { x: left, y: top + height },
      { x: left, y: top },
    ];
    return corners.flatMap((corner, index) => {
      if (index === corners.length - 1) return [];
      return sampleSegment(corner, corners[index + 1]);
    });
  }

  const samples: Point[] = [];
  const rx = width / 2;
  const ry = height / 2;
  const cx = left + rx;
  const cy = top + ry;
  const segments = 24;
  for (let i = 0; i < segments; i += 1) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    samples.push(
      ...sampleSegment(
        { x: cx + rx * Math.cos(a1), y: cy + ry * Math.sin(a1) },
        { x: cx + rx * Math.cos(a2), y: cy + ry * Math.sin(a2) },
      ),
    );
  }
  return samples;
}

function pointInsideShape(shape: HighlightShape, kind: ShapeKind, point: Point) {
  const { x1, y1, x2, y2 } = shape;
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  if (kind === "rect") {
    return point.x >= left && point.x <= left + width && point.y >= top && point.y <= top + height;
  }

  if (kind === "ellipse" && width > 0 && height > 0) {
    const cx = left + width / 2;
    const cy = top + height / 2;
    const nx = (point.x - cx) / (width / 2);
    const ny = (point.y - cy) / (height / 2);
    return nx * nx + ny * ny <= 1;
  }

  return false;
}

export function shapeHitByEraser(
  shape: HighlightShape,
  kind: ShapeKind,
  eraserPoints: Point[],
  eraserWidth: number,
) {
  const radius = eraserBrushRadius(eraserWidth);
  const outline = shapeOutlineSamples(shape, kind);

  for (const eraserPoint of eraserPoints) {
    for (const sample of outline) {
      if (Math.hypot(sample.x - eraserPoint.x, sample.y - eraserPoint.y) <= radius) {
        return true;
      }
    }
    if (shape.filled && pointInsideShape(shape, kind, eraserPoint)) {
      return true;
    }
  }

  return false;
}
